"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@/lib/content";
import { getViewer, isStaff } from "./session";
import {
  validateCourse,
  validateLessons,
  validateLevel,
  validateQuestions,
  type CourseInput,
  type LessonInput,
  type LevelInput,
  type QuestionInput,
  type ValidationError,
} from "./validate";

/**
 * SERVER ACTION CMS.
 * Semua penulisan memakai sesi pengguna, jadi RLS di database tetap menjadi
 * penjaga utama; pengecekan role di sini hanya memberi pesan yang jelas.
 * Setelah berhasil, seluruh halaman publik dibangun ulang (ISR).
 */
export type ActionResult = { ok: true } | { ok: false; error: ValidationError };

const err = (code: string, index?: number): ActionResult => ({
  ok: false,
  error: index === undefined ? { code } : { code, index },
});

/** Kode galat Postgres → kode pesan. */
function dbError(e: { code?: string; message?: string } | null): ActionResult {
  switch (e?.code) {
    case "23505":
      return err("duplicate");
    case "23503":
      return err("inUse");
    case "42501":
      return err("forbidden");
    case "23514":
      return err("invalid");
  }
  if (e?.message?.includes("cannot_demote_self")) return err("cannotDemoteSelf");
  if (e?.message?.includes("row-level security")) return err("forbidden");
  return err("generic");
}

function refreshSite() {
  revalidatePath("/[locale]", "layout");
}

async function staff() {
  const s = await getViewer();
  return s && isStaff(s.viewer.role) ? s : null;
}

async function superAdmin() {
  const s = await getViewer();
  return s?.viewer.role === "super_admin" ? s : null;
}

// ---- kelas ---------------------------------------------------------------

export async function saveCourse(input: CourseInput, mode: "create" | "update"): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const v = validateCourse(input);
  if (!v.ok) return { ok: false, error: v.error };
  const c = v.value;

  const row = {
    level_id: c.levelId,
    title: c.title,
    summary: c.summary,
    // Guru selalu menjadi pemilik kelasnya sendiri.
    teacher_id: s.viewer.role === "super_admin" ? c.teacherId : s.viewer.id,
    teacher_name: c.teacherName,
    published: c.published,
    position: c.position,
  };

  if (mode === "create") {
    const { error } = await s.sb.from("courses").insert({ slug: c.slug, ...row });
    if (error) return error.code === "23505" ? err("slugTaken") : dbError(error);
  } else {
    const { data, error } = await s.sb.from("courses").update(row).eq("slug", c.slug).select("slug");
    if (error) return dbError(error);
    if (!data?.length) return err("forbidden");
  }
  refreshSite();
  return { ok: true };
}

export async function deleteCourse(slug: string): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const { data, error } = await s.sb.from("courses").delete().eq("slug", slug).select("slug");
  if (error) return dbError(error);
  if (!data?.length) return err("forbidden");
  refreshSite();
  return { ok: true };
}

/** Menyimpan seluruh daftar pelajaran (urutan = posisi). Pelajaran yang dihapus dari daftar ikut dihapus. */
export async function saveLessons(slug: string, list: LessonInput[]): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const v = validateLessons(list);
  if (!v.ok) return { ok: false, error: v.error };

  const { data: allowed } = await s.sb.rpc("can_edit_course", { p_slug: slug });
  if (!allowed) return err("forbidden");

  const rows = v.value.map((l, position) => ({
    course_slug: slug,
    id: l.id,
    title: l.title,
    minutes: l.minutes,
    youtube_id: l.youtubeId,
    position,
  }));
  if (rows.length) {
    const { error } = await s.sb.from("lessons").upsert(rows, { onConflict: "course_slug,id" });
    if (error) return dbError(error);
  }
  let del = s.sb.from("lessons").delete().eq("course_slug", slug);
  // Id pelajaran hanya [a-z0-9-] (divalidasi), aman disusun ke filter.
  if (rows.length) del = del.not("id", "in", `(${rows.map((r) => r.id).join(",")})`);
  const { error } = await del;
  if (error) return dbError(error);

  refreshSite();
  return { ok: true };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Menyimpan seluruh bank soal kelas (urutan = posisi). Soal yang dihapus dari daftar ikut dihapus. */
export async function saveQuestions(slug: string, list: QuestionInput[]): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const v = validateQuestions(list);
  if (!v.ok) return { ok: false, error: v.error };

  const { data: allowed } = await s.sb.rpc("can_edit_course", { p_slug: slug });
  if (!allowed) return err("forbidden");

  const rows = v.value.map((q, position) => ({
    id: q.id && UUID_RE.test(q.id) ? q.id : crypto.randomUUID(),
    course_slug: slug,
    position,
    prompt: q.prompt,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
  }));
  if (rows.length) {
    const { error } = await s.sb.from("quiz_questions").upsert(rows, { onConflict: "id" });
    if (error) return dbError(error);
  }
  let del = s.sb.from("quiz_questions").delete().eq("course_slug", slug);
  if (rows.length) del = del.not("id", "in", `(${rows.map((r) => r.id).join(",")})`);
  const { error } = await del;
  if (error) return dbError(error);

  refreshSite();
  return { ok: true };
}

// ---- jenjang & harga (super admin) ---------------------------------------

export async function saveLevel(input: LevelInput, mode: "create" | "update"): Promise<ActionResult> {
  const s = await superAdmin();
  if (!s) return err("forbidden");
  const v = validateLevel(input);
  if (!v.ok) return { ok: false, error: v.error };
  const l = v.value;
  const row = {
    name: l.name,
    tagline: l.tagline,
    price: l.price,
    original_price: l.originalPrice,
    featured: l.featured,
    subjects: l.subjects,
    color: l.color,
    position: l.position,
  };
  const { error } =
    mode === "create"
      ? await s.sb.from("levels").insert({ id: l.id, ...row })
      : await s.sb.from("levels").update(row).eq("id", l.id);
  if (error) return error.code === "23505" ? err("levelIdTaken") : dbError(error);
  refreshSite();
  return { ok: true };
}

export async function deleteLevel(id: string): Promise<ActionResult> {
  const s = await superAdmin();
  if (!s) return err("forbidden");
  const { error } = await s.sb.from("levels").delete().eq("id", id);
  if (error) return error.code === "23503" ? err("levelInUse") : dbError(error);
  refreshSite();
  return { ok: true };
}

// ---- pengguna (super admin) ----------------------------------------------

const ROLES: Role[] = ["student", "teacher", "super_admin"];

export async function setUserRole(userId: string, role: Role): Promise<ActionResult> {
  const s = await superAdmin();
  if (!s) return err("forbidden");
  if (!ROLES.includes(role)) return err("invalid");
  const { error } = await s.sb.rpc("set_user_role", { target: userId, new_role: role });
  if (error) return dbError(error);
  return { ok: true };
}

// ---- ulasan (super admin) ------------------------------------------------

export async function setReviewApproved(id: string, approved: boolean): Promise<ActionResult> {
  const s = await superAdmin();
  if (!s) return err("forbidden");
  const { error } = await s.sb.from("reviews").update({ approved }).eq("id", id);
  if (error) return dbError(error);
  refreshSite();
  return { ok: true };
}

export async function deleteReview(id: string): Promise<ActionResult> {
  const s = await superAdmin();
  if (!s) return err("forbidden");
  const { error } = await s.sb.from("reviews").delete().eq("id", id);
  if (error) return dbError(error);
  refreshSite();
  return { ok: true };
}
