"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "./auth";
import { createLocalStore } from "./store";
import { createClient } from "./supabase/client";

/**
 * PROGRES BELAJAR
 * - Tamu (belum login): disimpan di localStorage.
 * - Sudah login: disimpan di tabel `lesson_progress` (Supabase).
 *   Progres lokal yang dibuat sebelum login digabung ke akun sekali saja.
 * - Jika server tidak bisa dijangkau (mis. tabel belum dibuat), tetap
 *   memakai localStorage supaya fitur belajar tidak berhenti.
 */
type ProgressMap = Record<string, string[]>; // courseSlug -> id pelajaran selesai

const localStore = createLocalStore<ProgressMap>("ja:progress", {});

// ---- store server (per pengguna) -----------------------------------------

type Remote = { userId: string | null; map: ProgressMap; ok: boolean };
const EMPTY_REMOTE: Remote = { userId: null, map: {}, ok: false };

let remote: Remote = EMPTY_REMOTE;
const listeners = new Set<() => void>();

function setRemote(next: Remote) {
  remote = next;
  listeners.forEach((l) => l());
}

function subscribeRemote(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const CONFLICT = "user_id,course_slug,lesson_id";
let loading: { userId: string; promise: Promise<void> } | null = null;

async function load(userId: string) {
  const sb = createClient();

  // Gabungkan progres lokal (dibuat sebelum login) ke akun ini.
  const rows = Object.entries(localStore.get()).flatMap(([course_slug, ids]) =>
    ids.map((lesson_id) => ({ user_id: userId, course_slug, lesson_id })),
  );
  if (rows.length) {
    const { error } = await sb
      .from("lesson_progress")
      .upsert(rows, { onConflict: CONFLICT, ignoreDuplicates: true });
    if (!error) localStore.set({});
  }

  const { data, error } = await sb
    .from("lesson_progress")
    .select("course_slug, lesson_id");
  if (loading?.userId !== userId) return; // pengguna berganti selagi memuat
  if (error || !data) return setRemote({ userId, map: {}, ok: false });

  const map: ProgressMap = {};
  for (const r of data) (map[r.course_slug] ??= []).push(r.lesson_id);
  setRemote({ userId, map, ok: true });
}

function ensureLoaded(userId: string) {
  if (loading?.userId === userId) return;
  loading = { userId, promise: Promise.resolve() };
  loading.promise = load(userId).catch(() =>
    setRemote({ userId, map: {}, ok: false }),
  );
}

function reset() {
  loading = null;
  if (remote !== EMPTY_REMOTE) setRemote(EMPTY_REMOTE);
}

function applyRemote(userId: string, slug: string, lessonId: string, done: boolean) {
  if (remote.userId !== userId) return;
  const list = remote.map[slug] ?? [];
  const next = done
    ? list.includes(lessonId) ? list : [...list, lessonId]
    : list.filter((id) => id !== lessonId);
  setRemote({ ...remote, map: { ...remote.map, [slug]: next } });
}

/** Ubah status selesai: langsung di UI, lalu ke server (dibatalkan jika gagal). */
async function setRemoteDone(userId: string, slug: string, lessonId: string, done: boolean) {
  applyRemote(userId, slug, lessonId, done);
  const sb = createClient();
  const row = { user_id: userId, course_slug: slug, lesson_id: lessonId };
  const { error } = done
    ? await sb
        .from("lesson_progress")
        .upsert(row, { onConflict: CONFLICT, ignoreDuplicates: true })
    : await sb.from("lesson_progress").delete().match(row);
  if (error) applyRemote(userId, slug, lessonId, !done);
}

// ---- hook ----------------------------------------------------------------

export function useProgress() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const local = localStore.useValue();
  const server = useSyncExternalStore(
    subscribeRemote,
    () => remote,
    () => EMPTY_REMOTE,
  );

  useEffect(() => {
    if (userId) ensureLoaded(userId);
    else reset();
  }, [userId]);

  const useServer = userId !== null && server.userId === userId && server.ok;
  const map = useServer ? server.map : local;

  const doneIds = (slug: string) => map[slug] ?? [];
  const isDone = (slug: string, lessonId: string) =>
    doneIds(slug).includes(lessonId);

  const setDone = (slug: string, lessonId: string, done: boolean) => {
    if (useServer) {
      void setRemoteDone(userId, slug, lessonId, done);
      return;
    }
    const current = localStore.get();
    const list = current[slug] ?? [];
    const next = done
      ? list.includes(lessonId) ? list : [...list, lessonId]
      : list.filter((id) => id !== lessonId);
    localStore.set({ ...current, [slug]: next });
  };

  const toggle = (slug: string, lessonId: string) =>
    setDone(slug, lessonId, !isDone(slug, lessonId));

  const markDone = (slug: string, lessonId: string) => {
    if (!isDone(slug, lessonId)) setDone(slug, lessonId, true);
  };

  return { doneIds, isDone, toggle, markDone };
}
