"use client";

import { getClient } from "./auth";
import type { L10n } from "./content";
import type { TryoutResult, TryoutSection } from "./tryout";

/** Pemanggil RPC try-out dari browser (sesi login; izin dijaga database). */

export type StartError = "noAccess" | "closed" | "notSignedIn" | "generic";

export type Paper = {
  startedAt: string;
  deadline: string;
  submitted: boolean;
  answers: Record<string, number>;
  sections: TryoutSection[];
};

function errorCode(message: string): StartError {
  if (message.includes("no_access")) return "noAccess";
  if (message.includes("closed")) return "closed";
  if (message.includes("not_signed_in")) return "notSignedIn";
  return "generic";
}

export async function startTryout(slug: string): Promise<{ paper: Paper } | { error: StartError }> {
  const { data, error } = await getClient().rpc("start_tryout", { p_slug: slug });
  if (error) return { error: errorCode(error.message) };
  const d = data as {
    started_at: string;
    deadline: string;
    submitted: boolean;
    answers: Record<string, number>;
    sections: TryoutSection[];
  };
  return {
    paper: { startedAt: d.started_at, deadline: d.deadline, submitted: d.submitted, answers: d.answers ?? {}, sections: d.sections },
  };
}

export async function saveTryoutAnswers(slug: string, answers: Record<string, number>) {
  const { data, error } = await getClient().rpc("save_tryout_answers", { p_slug: slug, p_answers: answers });
  return !error && data === true;
}

type RawResult = {
  score: number;
  total: number;
  submitted_at: string;
  answers: Record<string, number>;
  section_scores: { id: string; score: number; total: number }[];
  rank: number;
  participants: number;
  key: { id: string; section_id: string; prompt: L10n; options: L10n[]; answer: number; explanation: L10n }[];
  section_avg: Record<string, number>;
};

const toResult = (r: RawResult): TryoutResult => ({
  score: r.score,
  total: r.total,
  submittedAt: r.submitted_at,
  answers: r.answers ?? {},
  sectionScores: r.section_scores ?? [],
  rank: r.rank,
  participants: r.participants,
  key: (r.key ?? []).map((k) => ({ ...k, sectionId: k.section_id })),
  sectionAvg: r.section_avg ?? {},
});

export async function submitTryout(slug: string, answers: Record<string, number>): Promise<TryoutResult | null> {
  const { data, error } = await getClient().rpc("submit_tryout", { p_slug: slug, p_answers: answers });
  return error || !data ? null : toResult(data as RawResult);
}

export async function getTryoutResult(slug: string): Promise<TryoutResult | null> {
  const { data, error } = await getClient().rpc("tryout_result", { p_slug: slug });
  return error || !data ? null : toResult(data as RawResult);
}

export type AttemptState = { startedAt: string; deadline: string; submittedAt: string | null } | null;

export async function getMyAttempt(slug: string): Promise<AttemptState> {
  const { data } = await getClient()
    .from("tryout_attempts")
    .select("started_at, deadline, submitted_at")
    .eq("tryout_slug", slug)
    .maybeSingle();
  return data ? { startedAt: data.started_at, deadline: data.deadline, submittedAt: data.submitted_at } : null;
}

export type LeaderRow = { rank: number; name: string | null; avatarPath: string | null; score: number; total: number; isMe: boolean };

export async function getTryoutLeaderboard(slug: string): Promise<LeaderRow[]> {
  const { data, error } = await getClient().rpc("tryout_leaderboard", { p_slug: slug });
  if (error) return [];
  return (
    data as { rank: number; name: string | null; avatar_path: string | null; score: number; total: number; is_me: boolean }[]
  ).map((r) => ({ rank: r.rank, name: r.name, avatarPath: r.avatar_path, score: r.score, total: r.total, isMe: r.is_me }));
}
