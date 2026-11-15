"use client";

import { getClient } from "./auth";
import type { L10n, LessonContent } from "./content";
import { isSupabaseConfigured } from "./supabase/client";

/**
 * Isi pelajaran (video, catatan, materi) lewat RPC `lesson_content`.
 * Database yang memutuskan: tanpa hak akses, hanya `{ access: false }` yang dikirim.
 */
export async function fetchLessonContent(slug: string, lessonId: string): Promise<LessonContent | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await getClient().rpc("lesson_content", { p_slug: slug, p_lesson: lessonId });
  if (error) throw error;
  if (!data) return null;
  const d = data as {
    access: boolean;
    youtube_id?: string;
    notes?: L10n;
    materials?: { id: string; title: string; path: string; size: number }[];
  };
  if (!d.access) return { access: false };
  return {
    access: true,
    youtubeId: d.youtube_id ?? "",
    notes: d.notes ?? ({} as L10n),
    materials: d.materials ?? [],
  };
}

/** Tautan unduh sementara (1 jam) untuk file materi di bucket privat. */
export async function materialUrl(path: string): Promise<string | null> {
  const name = path.split("/").pop() ?? "materi";
  const { data, error } = await getClient()
    .storage.from("materials")
    .createSignedUrl(path, 3600, { download: name });
  return error ? null : data.signedUrl;
}
