"use client";

import type { TutorError, TutorRequest } from "./tutor";

/** Mengirim pertanyaan ke /api/tutor dan menerima jawaban sedikit demi sedikit. */
export async function askTutor(
  body: TutorRequest,
  onText: (chunk: string) => void,
): Promise<{ ok: true; remaining: number | null } | { ok: false; error: TutorError }> {
  let res: Response;
  try {
    res = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: "generic" };
  }
  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => null)) as { error?: TutorError } | null;
    return { ok: false, error: data?.error ?? "generic" };
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onText(decoder.decode(value, { stream: true }));
  }
  const remaining = res.headers.get("X-Tutor-Remaining");
  return { ok: true, remaining: remaining === null ? null : Number(remaining) };
}
