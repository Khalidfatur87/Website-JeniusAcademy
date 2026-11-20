"use client";

import { getClient } from "./auth";
import type { L10n } from "./content";
import type { AchievementStats } from "./gamification";

/** Orang tua, latihan pintar, dan gamifikasi — RPC dengan sesi pengguna. */

// ---- orang tua ---------------------------------------------------------------

export async function createParentCode(): Promise<{ code: string; expiresAt: string } | null> {
  const { data, error } = await getClient().rpc("create_parent_code");
  if (error || !data) return null;
  return { code: data.code as string, expiresAt: data.expires_at as string };
}

export type RedeemError = "invalidCode" | "ownCode" | "generic";

export async function redeemParentCode(code: string): Promise<{ name: string } | { error: RedeemError }> {
  const { data, error } = await getClient().rpc("redeem_parent_code", { p_code: code });
  if (error) {
    if (error.message.includes("invalid_code")) return { error: "invalidCode" };
    if (error.message.includes("own_code")) return { error: "ownCode" };
    return { error: "generic" };
  }
  return { name: data as string };
}

export type ChildSummary = {
  studentId: string;
  name: string;
  avatarPath: string | null;
  lessonsTotal: number;
  lessonsWeek: number;
  quizzesWeek: number;
  avgQuizPercent: number | null;
  lastActive: string | null;
  activeDays: string[];
  courses: { slug: string; title: L10n; done: number; total: number }[];
};

export async function getChildren(): Promise<ChildSummary[]> {
  const { data, error } = await getClient().rpc("parent_children");
  if (error) throw error;
  return (
    data as {
      student_id: string;
      name: string;
      avatar_path: string | null;
      lessons_total: number;
      lessons_week: number;
      quizzes_week: number;
      avg_quiz_percent: number | null;
      last_active: string | null;
      active_days: string[] | null;
      courses: { slug: string; title: L10n; done: number; total: number }[];
    }[]
  ).map((r) => ({
    studentId: r.student_id,
    name: r.name,
    avatarPath: r.avatar_path,
    lessonsTotal: r.lessons_total,
    lessonsWeek: r.lessons_week,
    quizzesWeek: r.quizzes_week,
    avgQuizPercent: r.avg_quiz_percent,
    lastActive: r.last_active,
    activeDays: r.active_days ?? [],
    courses: r.courses ?? [],
  }));
}

export async function getMyParents(): Promise<{ parentId: string; name: string; linkedAt: string }[]> {
  const { data, error } = await getClient().rpc("my_parents");
  if (error) return [];
  return (data as { parent_id: string; name: string; linked_at: string }[]).map((r) => ({
    parentId: r.parent_id,
    name: r.name,
    linkedAt: r.linked_at,
  }));
}

/** Melepas tautan (dari sisi orang tua atau siswa; RLS memastikan pihak terkait). */
export async function unlinkParent(parentId: string, studentId: string) {
  const { error } = await getClient()
    .from("parent_links")
    .delete()
    .eq("parent_id", parentId)
    .eq("student_id", studentId);
  return !error;
}

// ---- latihan pintar ------------------------------------------------------------

export type PracticeItem = {
  id: string;
  courseSlug: string;
  courseTitle: L10n;
  prompt: L10n;
  options: L10n[];
  box: number;
};

export async function getPracticeQueue(limit = 10): Promise<PracticeItem[]> {
  const { data, error } = await getClient().rpc("practice_queue", { p_limit: limit });
  if (error) throw error;
  return (
    data as { id: string; course_slug: string; course_title: L10n; prompt: L10n; options: L10n[]; box: number }[]
  ).map((r) => ({
    id: r.id,
    courseSlug: r.course_slug,
    courseTitle: r.course_title,
    prompt: r.prompt,
    options: r.options,
    box: r.box,
  }));
}

export type PracticeSummary = { due: number; tracked: number; nextDue: string | null };

export async function getPracticeSummary(): Promise<PracticeSummary | null> {
  const { data, error } = await getClient().rpc("practice_summary");
  if (error || !data) return null;
  return { due: data.due as number, tracked: data.tracked as number, nextDue: (data.next_due as string | null) ?? null };
}

export type PracticeAnswer = { correct: boolean; answer: number; explanation: L10n; mastered: boolean };

export async function answerPractice(questionId: string, choice: number): Promise<PracticeAnswer | null> {
  const { data, error } = await getClient().rpc("answer_practice", { p_question: questionId, p_choice: choice });
  if (error || !data) return null;
  return data as PracticeAnswer;
}

// ---- gamifikasi --------------------------------------------------------------------

export async function getAchievements(): Promise<AchievementStats | null> {
  const { data, error } = await getClient().rpc("my_achievements");
  if (error || !data) return null;
  return {
    xpTotal: Number(data.xp_total),
    xpWeek: Number(data.xp_week),
    lessons: Number(data.lessons),
    perfectQuizzes: Number(data.perfect_quizzes),
    certificates: Number(data.certificates),
    tryouts: Number(data.tryouts),
    practiceCorrect: Number(data.practice_correct),
    activeDays: (data.active_days as string[]) ?? [],
  };
}

export type XpRow = { rank: number; name: string; avatarPath: string | null; xp: number; isMe: boolean };

export async function getXpLeaderboard(period: "week" | "all", level: string | null): Promise<XpRow[]> {
  const { data, error } = await getClient().rpc("xp_leaderboard", { p_period: period, p_level: level ?? "" });
  if (error) return [];
  return (data as { rank: number; name: string; avatar_path: string | null; xp: number; is_me: boolean }[]).map((r) => ({
    rank: r.rank,
    name: r.name,
    avatarPath: r.avatar_path,
    xp: Number(r.xp),
    isMe: r.is_me,
  }));
}

export async function setShowOnLeaderboard(userId: string, show: boolean) {
  const { error } = await getClient().from("profiles").update({ show_on_leaderboard: show }).eq("id", userId);
  return !error;
}

export async function getShowOnLeaderboard(userId: string): Promise<boolean> {
  const { data } = await getClient().from("profiles").select("show_on_leaderboard").eq("id", userId).maybeSingle();
  return data?.show_on_leaderboard ?? true;
}
