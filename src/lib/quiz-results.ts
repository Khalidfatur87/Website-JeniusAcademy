"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "./auth";
import type { Attempt } from "./quiz";
import { createLocalStore } from "./store";
import { createClient } from "./supabase/client";

/**
 * RIWAYAT KUIS
 * - Tamu: localStorage.
 * - Login: tabel `quiz_attempts` (Supabase); riwayat lokal digabung sekali.
 * - Server tidak terjangkau (mis. tabel belum dibuat): tetap memakai localStorage.
 */
const localStore = createLocalStore<Attempt[]>("ja:quiz", []);

type Remote = { userId: string | null; attempts: Attempt[]; ok: boolean };
const EMPTY: Remote = { userId: null, attempts: [], ok: false };

let remote: Remote = EMPTY;
const listeners = new Set<() => void>();

function setRemote(next: Remote) {
  remote = next;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

type Row = { course_slug: string; score: number; total: number; created_at: string };

const toAttempt = (r: Row): Attempt => ({
  courseSlug: r.course_slug,
  score: r.score,
  total: r.total,
  at: r.created_at,
});

let loadingFor: string | null = null;

async function load(userId: string) {
  const sb = createClient();

  // Gabungkan riwayat lokal (dibuat sebelum login) ke akun ini.
  const pending = localStore.get();
  if (pending.length) {
    const { error } = await sb.from("quiz_attempts").insert(
      pending.map((a) => ({
        user_id: userId,
        course_slug: a.courseSlug,
        score: a.score,
        total: a.total,
        created_at: a.at,
      })),
    );
    if (!error) localStore.set([]);
  }

  const { data, error } = await sb
    .from("quiz_attempts")
    .select("course_slug, score, total, created_at")
    .order("created_at", { ascending: false });
  if (loadingFor !== userId) return; // pengguna berganti selagi memuat
  if (error || !data) return setRemote({ userId, attempts: [], ok: false });
  setRemote({ userId, attempts: (data as Row[]).map(toAttempt), ok: true });
}

function ensureLoaded(userId: string) {
  if (loadingFor === userId) return;
  loadingFor = userId;
  load(userId).catch(() => setRemote({ userId, attempts: [], ok: false }));
}

function reset() {
  loadingFor = null;
  if (remote !== EMPTY) setRemote(EMPTY);
}

export function useQuizResults() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const local = localStore.useValue();
  const server = useSyncExternalStore(
    subscribe,
    () => remote,
    () => EMPTY,
  );

  useEffect(() => {
    if (userId) ensureLoaded(userId);
    else reset();
  }, [userId]);

  const useServer = userId !== null && server.userId === userId && server.ok;
  const attempts = useServer ? server.attempts : local;

  /** Menyimpan hasil. Mengembalikan false jika gagal tersimpan di akun. */
  const record = async (courseSlug: string, score: number, total: number): Promise<boolean> => {
    const attempt: Attempt = { courseSlug, score, total, at: new Date().toISOString() };

    if (!useServer) {
      localStore.set([attempt, ...localStore.get()]);
      return true;
    }
    const { error } = await createClient().from("quiz_attempts").insert({
      user_id: userId,
      course_slug: courseSlug,
      score,
      total,
      created_at: attempt.at,
    });
    if (error) return false;
    if (remote.userId === userId) {
      setRemote({ ...remote, attempts: [attempt, ...remote.attempts] });
    }
    return true;
  };

  return { attempts, record };
}
