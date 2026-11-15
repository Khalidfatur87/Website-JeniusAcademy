"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getClient, useAuth } from "./auth";
import type { QuizResult } from "./content";
import type { Attempt } from "./quiz";
import { createLocalStore } from "./store";

/**
 * RIWAYAT KUIS
 * - Penilaian selalu di server (RPC `submit_quiz`): kunci jawaban tidak pernah
 *   dikirim sebelum kuis diserahkan, dan siswa tidak bisa menulis skornya sendiri.
 * - Login: server langsung menyimpan percobaan di tabel `quiz_attempts`.
 * - Tamu: skor hanya disimpan di localStorage (tidak dipindahkan ke akun
 *   saat login, karena skor dari browser tidak bisa dipercaya).
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
  const { data, error } = await getClient()
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

export type SubmitError = "noAccess" | "generic";

type RpcResult = {
  score: number;
  total: number;
  recorded: boolean;
  results: { id: string; answer: number; explanation: QuizResult["results"][number]["explanation"] }[];
};

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
  const attempts = userId ? (useServer ? server.attempts : []) : local;

  /** Menyerahkan jawaban untuk dinilai server. */
  const submit = async (
    courseSlug: string,
    answers: Record<string, number>,
  ): Promise<{ result: QuizResult } | { error: SubmitError }> => {
    const { data, error } = await getClient().rpc("submit_quiz", {
      p_slug: courseSlug,
      p_answers: answers,
    });
    if (error) return { error: error.message.includes("no_access") ? "noAccess" : "generic" };
    const r = data as RpcResult;
    const attempt: Attempt = { courseSlug, score: r.score, total: r.total, at: new Date().toISOString() };

    if (!r.recorded) {
      localStore.set([attempt, ...localStore.get()]);
    } else if (userId && remote.userId === userId) {
      setRemote({ ...remote, attempts: [attempt, ...remote.attempts] });
    }
    return { result: { score: r.score, total: r.total, recorded: r.recorded, results: r.results } };
  };

  return { attempts, submit };
}
