import Anthropic from "@anthropic-ai/sdk";
import { siteConfig } from "@/config/site";
import type { L10n } from "@/lib/content";
import { getCourse } from "@/lib/content-server";
import { createClient } from "@/lib/supabase/server";
import {
  lessonContext,
  parseTutorRequest,
  quizPrompt,
  TUTOR_SYSTEM,
  type TutorError,
} from "@/lib/tutor";

/**
 * TUTOR AI ("Tanya AI").
 * - Hanya untuk pengguna login yang berhak atas pelajaran / kelasnya (dicek di database).
 * - Kuota harian per pengguna (siteConfig.ai.dailyLimit, dihitung di tabel ai_usage).
 * - Jawaban dialirkan (streaming) sebagai teks biasa.
 * Butuh env ANTHROPIC_API_KEY dan TUTOR_AI_MODEL (server saja, jangan diberi awalan NEXT_PUBLIC_).
 */
export const runtime = "nodejs";
export const maxDuration = 60;


const fail = (error: TutorError, status: number) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const body = parseTutorRequest(await req.json().catch(() => null));
  if (!body) return fail("invalid", 400);
  const model = process.env.TUTOR_AI_MODEL;
  if (!siteConfig.features.tutorAi || !process.env.ANTHROPIC_API_KEY || !model) {
    return fail("notConfigured", 503);
  }

  const sb = await createClient();
  const { data: auth } = await sb.auth.getClaims();
  if (!auth?.claims?.sub) return fail("notSignedIn", 401);

  // Konteks + pemeriksaan hak akses (RLS / fungsi database memakai sesi siswa).
  let context: string;
  let messages: Anthropic.Beta.BetaMessageParam[];
  if (body.mode === "lesson") {
    const [{ data: content }, course] = await Promise.all([
      sb.rpc("lesson_content", { p_slug: body.slug, p_lesson: body.lessonId }),
      getCourse(body.slug),
    ]);
    const lesson = course?.lessons.find((l) => l.id === body.lessonId);
    if (!content?.access || !course || !lesson) return fail("noAccess", 403);
    context = lessonContext({
      courseTitle: course.title,
      lessonTitle: lesson.title,
      notes: (content.notes ?? null) as L10n | null,
      locale: body.locale,
    });
    messages = [...body.history, { role: "user", content: body.question }];
  } else {
    const { data: q } = await sb.rpc("quiz_question_for_ai", { p_question: body.questionId });
    if (!q) return fail("noAccess", 403);
    context = `Answer language: ${body.locale === "en" ? "English" : "Bahasa Indonesia"}.`;
    messages = [
      {
        role: "user",
        content: quizPrompt({
          prompt: q.prompt as L10n,
          options: q.options as L10n[],
          answer: q.answer as number,
          explanation: q.explanation as L10n,
          chosen: body.chosen,
          locale: body.locale,
        }),
      },
    ];
  }

  // Kuota dihitung setelah akses dipastikan, sebelum memanggil model.
  const { data: used, error: quotaError } = await sb.rpc("ai_take_quota");
  if (quotaError) return fail("generic", 500);
  if ((used as number) > siteConfig.ai.dailyLimit) return fail("quota", 429);

  const client = new Anthropic();
  const encoder = new TextEncoder();
  const refusalNote =
    body.locale === "en"
      ? "\n\n(Tutor Jenius can't answer this one. Try asking about the lesson material.)"
      : "\n\n(Tutor Jenius tidak bisa menjawab pertanyaan ini. Coba tanyakan materi pelajarannya.)";
  const errorNote =
    body.locale === "en"
      ? "\n\n(The answer was cut off. Please try again.)"
      : "\n\n(Jawaban terputus. Silakan coba lagi.)";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = client.beta.messages.stream({
          model,
          max_tokens: 4000,
          // Jawaban tutor tidak butuh penalaran panjang: effort rendah = cepat & hemat.
          output_config: { effort: "low" },
          // Jika model utama menolak karena klasifikasi keamanan, server mencoba model cadangan.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: [
            // Instruksi tetap di depan (bisa di-cache), konteks pelajaran setelahnya.
            { type: "text", text: TUTOR_SYSTEM },
            { type: "text", text: context, cache_control: { type: "ephemeral" } },
          ],
          messages,
        });
        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await response.finalMessage();
        if (final.stop_reason === "refusal") controller.enqueue(encoder.encode(refusalNote));
      } catch (error) {
        console.error("tutor:", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
        controller.enqueue(encoder.encode(errorNote));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Tutor-Remaining": String(Math.max(0, siteConfig.ai.dailyLimit - (used as number))),
    },
  });
}
