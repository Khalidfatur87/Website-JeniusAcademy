"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@/lib/content";
import { getViewer, isStaff } from "./session";
import {
  MATERIAL_MAX_BYTES,
  subscriptionExpiry,
  validateCourse,
  validateSubscriptionMonths,
  generateJoinCode,
  validateAssignment,
  validateLive,
  validateTryout,
  validateTryoutSections,
  type AssignmentInput,
  type LiveInput,
  type TryoutInput,
  type TryoutSectionInput,
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
  if (e?.message?.includes("forbidden")) return err("forbidden");
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

  // Disimpan sekaligus (atomik) lewat fungsi database yang memeriksa can_edit_course.
  const rows = v.value.map((l, position) => ({
    id: l.id,
    title: l.title,
    minutes: l.minutes,
    youtube_id: l.youtubeId,
    notes: l.notes,
    free_preview: l.freePreview,
    position,
  }));
  const { error } = await s.sb.rpc("save_lessons", { p_slug: slug, p_rows: rows });
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

  const rows = v.value.map((q, position) => ({
    id: q.id && UUID_RE.test(q.id) ? q.id : crypto.randomUUID(),
    position,
    prompt: q.prompt,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
  }));
  const { error } = await s.sb.rpc("save_questions", { p_slug: slug, p_rows: rows });
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

// ---- materi pelajaran ------------------------------------------------------

/**
 * Mencatat file materi yang sudah diunggah browser ke bucket "materials".
 * Path harus berada di folder <slug>/<id pelajaran>/ (dicek juga oleh database).
 */
export async function addMaterial(
  slug: string,
  lessonId: string,
  file: { title: string; path: string; size: number },
): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const title = file.title.trim().slice(0, 120);
  if (!title) return err("materialTitleRequired");
  if (!file.path.startsWith(`${slug}/${lessonId}/`) || file.path.includes("..")) return err("invalid");
  if (!Number.isInteger(file.size) || file.size < 0 || file.size > MATERIAL_MAX_BYTES) {
    return err("materialTooLarge");
  }
  const { count } = await s.sb
    .from("lesson_materials")
    .select("id", { count: "exact", head: true })
    .eq("course_slug", slug)
    .eq("lesson_id", lessonId);
  const { error } = await s.sb.from("lesson_materials").insert({
    course_slug: slug,
    lesson_id: lessonId,
    title,
    path: file.path,
    size: file.size,
    position: count ?? 0,
  });
  if (error) {
    await s.sb.storage.from("materials").remove([file.path]);
    return dbError(error);
  }
  return { ok: true };
}

export async function deleteMaterial(id: string): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const { data, error } = await s.sb.from("lesson_materials").delete().eq("id", id).select("path");
  if (error) return dbError(error);
  if (!data?.length) return err("forbidden");
  await s.sb.storage.from("materials").remove(data.map((r) => r.path));
  return { ok: true };
}

// ---- langganan (super admin) -------------------------------------------------

/** Memberi / memperpanjang akses jenjang untuk satu pengguna. months null = tanpa batas. */
export async function grantSubscription(
  userId: string,
  levelId: string,
  months: number | null,
  note: string,
): Promise<ActionResult> {
  const s = await superAdmin();
  if (!s) return err("forbidden");
  if (!UUID_RE.test(userId)) return err("userRequired");
  if (!levelId) return err("levelRequired");
  if (!validateSubscriptionMonths(months)) return err("invalid");
  const cleanNote = note.trim();
  if (cleanNote.length > 200) return err("noteTooLong");

  const { data: current } = await s.sb
    .from("subscriptions")
    .select("expires_at")
    .eq("user_id", userId)
    .eq("level_id", levelId)
    .maybeSingle();

  const { error } = await s.sb.from("subscriptions").upsert(
    {
      user_id: userId,
      level_id: levelId,
      expires_at: subscriptionExpiry(months, current?.expires_at),
      note: cleanNote,
      granted_by: s.viewer.id,
    },
    { onConflict: "user_id,level_id" },
  );
  if (error) return dbError(error);
  return { ok: true };
}

export async function revokeSubscription(userId: string, levelId: string): Promise<ActionResult> {
  const s = await superAdmin();
  if (!s) return err("forbidden");
  const { error } = await s.sb
    .from("subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("level_id", levelId);
  if (error) return dbError(error);
  return { ok: true };
}

// ---- diskusi -------------------------------------------------------------------

/** Menjawab pertanyaan siswa dari CMS. Izin dicek RLS (guru pemilik / super admin). */
export async function replyToQuestion(
  questionId: string,
  slug: string,
  lessonId: string,
  body: string,
): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const text = body.trim();
  if (!text) return err("replyRequired");
  if (text.length > 2000) return err("replyTooLong");
  const { error } = await s.sb.from("lesson_comments").insert({
    course_slug: slug,
    lesson_id: lessonId,
    user_id: s.viewer.id,
    parent_id: questionId,
    body: text,
  });
  if (error) return dbError(error);
  return { ok: true };
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const { data, error } = await s.sb.from("lesson_comments").delete().eq("id", id).select("id");
  if (error) return dbError(error);
  if (!data?.length) return err("forbidden");
  return { ok: true };
}

// ---- try-out -------------------------------------------------------------------

export async function saveTryout(input: TryoutInput, mode: "create" | "update"): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const v = validateTryout(input);
  if (!v.ok) return { ok: false, error: v.error };
  const x = v.value;
  const row = {
    level_id: x.levelId,
    title: x.title,
    description: x.description,
    published: x.published,
    opens_at: x.opensAt,
    closes_at: x.closesAt,
    position: x.position,
  };
  if (mode === "create") {
    const { error } = await s.sb.from("tryouts").insert({ slug: x.slug, created_by: s.viewer.id, ...row });
    if (error) return error.code === "23505" ? err("slugTaken") : dbError(error);
  } else {
    const { data, error } = await s.sb.from("tryouts").update(row).eq("slug", x.slug).select("slug");
    if (error) return dbError(error);
    if (!data?.length) return err("forbidden");
  }
  revalidatePath("/[locale]/tryouts", "layout");
  return { ok: true };
}

export async function deleteTryout(slug: string): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const { data, error } = await s.sb.from("tryouts").delete().eq("slug", slug).select("slug");
  if (error) return dbError(error);
  if (!data?.length) return err("forbidden");
  revalidatePath("/[locale]/tryouts", "layout");
  return { ok: true };
}

/** Menyimpan seluruh subtes & soal sekaligus (ditolak database bila sudah ada peserta). */
export async function saveTryoutContent(slug: string, sections: TryoutSectionInput[]): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const v = validateTryoutSections(sections);
  if (!v.ok) return { ok: false, error: v.error };
  const { error } = await s.sb.rpc("save_tryout_content", { p_slug: slug, p_sections: v.value });
  if (error) return error.message.includes("has_attempts") ? err("tryoutLocked") : dbError(error);
  revalidatePath("/[locale]/tryouts", "layout");
  return { ok: true };
}

// ---- kelas live ------------------------------------------------------------------

export async function saveLive(input: LiveInput, id: string | null): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const v = validateLive(input);
  if (!v.ok) return { ok: false, error: v.error };
  const x = v.value;
  const row = {
    level_id: x.levelId,
    course_slug: x.courseSlug,
    title: x.title,
    description: x.description,
    starts_at: x.startsAt,
    minutes: x.minutes,
    host_name: x.hostName,
    join_url: x.joinUrl,
    recording_youtube_id: x.recordingYoutubeId,
  };
  if (id) {
    if (!UUID_RE.test(id)) return err("invalid");
    const { data, error } = await s.sb.from("live_sessions").update(row).eq("id", id).select("id");
    if (error) return dbError(error);
    if (!data?.length) return err("forbidden");
  } else {
    const { error } = await s.sb.from("live_sessions").insert({ ...row, created_by: s.viewer.id });
    if (error) return dbError(error);
  }
  revalidatePath("/[locale]/live", "layout");
  return { ok: true };
}

export async function deleteLive(id: string): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const { data, error } = await s.sb.from("live_sessions").delete().eq("id", id).select("id");
  if (error) return dbError(error);
  if (!data?.length) return err("forbidden");
  revalidatePath("/[locale]/live", "layout");
  return { ok: true };
}

/** Rekaman sesi → pelajaran baru di akhir kelas terkait. */
export async function liveToLesson(id: string): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const { error } = await s.sb.rpc("live_to_lesson", { p_id: id });
  if (error) return error.message.includes("invalid") ? err("liveNeedsCourse") : dbError(error);
  refreshSite();
  return { ok: true };
}

// ---- mode sekolah ------------------------------------------------------------------

export async function createClassroom(name: string): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const clean = name.trim();
  if (!clean) return err("titleRequired");
  if (clean.length > 80) return err("titleTooLong");
  // Ulangi bila kode kebetulan sudah dipakai.
  for (let i = 0; i < 5; i++) {
    const { error } = await s.sb
      .from("classrooms")
      .insert({ name: clean, teacher_id: s.viewer.id, join_code: generateJoinCode() });
    if (!error) return { ok: true };
    if (error.code !== "23505") return dbError(error);
  }
  return err("generic");
}

export async function updateClassroom(id: string, patch: { name?: string; archived?: boolean }): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const row: { name?: string; archived?: boolean } = {};
  if (patch.name !== undefined) {
    const clean = patch.name.trim();
    if (!clean) return err("titleRequired");
    if (clean.length > 80) return err("titleTooLong");
    row.name = clean;
  }
  if (patch.archived !== undefined) row.archived = Boolean(patch.archived);
  const { data, error } = await s.sb.from("classrooms").update(row).eq("id", id).select("id");
  if (error) return dbError(error);
  if (!data?.length) return err("forbidden");
  return { ok: true };
}

export async function deleteClassroom(id: string): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const { data, error } = await s.sb.from("classrooms").delete().eq("id", id).select("id");
  if (error) return dbError(error);
  if (!data?.length) return err("forbidden");
  return { ok: true };
}

export async function setClassroomSponsor(id: string, levelId: string | null): Promise<ActionResult> {
  const s = await superAdmin();
  if (!s) return err("forbidden");
  const { error } = await s.sb.rpc("set_classroom_sponsor", { p_id: id, p_level: levelId ?? "" });
  if (error) return dbError(error);
  return { ok: true };
}

export async function removeClassroomMember(classroomId: string, studentId: string): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const { data, error } = await s.sb
    .from("classroom_members")
    .delete()
    .eq("classroom_id", classroomId)
    .eq("student_id", studentId)
    .select("student_id");
  if (error) return dbError(error);
  if (!data?.length) return err("forbidden");
  return { ok: true };
}

export async function saveAssignment(classroomId: string, input: AssignmentInput): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const v = validateAssignment(input);
  if (!v.ok) return { ok: false, error: v.error };
  const a = v.value;
  const { error } = await s.sb.from("assignments").insert({
    classroom_id: classroomId,
    title: a.title,
    instructions: a.instructions,
    kind: a.kind,
    course_slug: a.courseSlug,
    lesson_id: a.lessonId,
    due_at: a.dueAt,
  });
  if (error) return dbError(error);
  return { ok: true };
}

export async function deleteAssignment(id: string): Promise<ActionResult> {
  const s = await staff();
  if (!s) return err("forbidden");
  const { data, error } = await s.sb.from("assignments").delete().eq("id", id).select("id");
  if (error) return dbError(error);
  if (!data?.length) return err("forbidden");
  return { ok: true };
}
