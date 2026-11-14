import type { L10n, Level, Role } from "@/lib/content";
import {
  byPosition,
  LEVEL_COLUMNS,
  toLevel,
  type LessonRow,
  type LevelRow,
  type QuestionRow,
} from "@/lib/content-server";
import { getViewer, type Viewer } from "./session";

/** Kueri CMS: memakai sesi pengguna (RLS berlaku), hanya dipanggil dari halaman /admin. */

type Sb = NonNullable<Awaited<ReturnType<typeof getViewer>>>["sb"];

export type AdminCourseSummary = {
  slug: string;
  title: L10n;
  levelId: string;
  published: boolean;
  teacherName: string;
  lessonCount: number;
  questionCount: number;
};

export async function listEditableCourses(sb: Sb, viewer: Viewer): Promise<AdminCourseSummary[]> {
  let q = sb
    .from("courses")
    .select("slug, title, level_id, published, teacher_name, position, lessons(count), quiz_questions(count)")
    .order("position")
    .order("slug");
  // Guru juga bisa MEMBACA kelas terbit milik guru lain; di CMS hanya tampil miliknya.
  if (viewer.role !== "super_admin") q = q.eq("teacher_id", viewer.id);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data.map((r) => ({
    slug: r.slug,
    title: r.title as L10n,
    levelId: r.level_id,
    published: r.published,
    teacherName: r.teacher_name,
    lessonCount: (r.lessons as { count: number }[])[0]?.count ?? 0,
    questionCount: (r.quiz_questions as { count: number }[])[0]?.count ?? 0,
  }));
}

export type AdminCourse = {
  slug: string;
  levelId: string;
  title: L10n;
  summary: L10n;
  teacherId: string | null;
  teacherName: string;
  published: boolean;
  position: number;
  lessons: { id: string; title: L10n; minutes: number; youtubeId: string }[];
  questions: {
    id: string;
    prompt: L10n;
    options: L10n[];
    answer: number;
    explanation: L10n;
  }[];
};

/** Kelas lengkap untuk editor; null jika tidak ada ATAU bukan milik guru ini. */
export async function getEditableCourse(
  sb: Sb,
  viewer: Viewer,
  slug: string,
): Promise<AdminCourse | null> {
  const { data, error } = await sb
    .from("courses")
    .select(
      "slug, level_id, title, summary, teacher_id, teacher_name, published, position, lessons(id, title, minutes, youtube_id, position), quiz_questions(id, prompt, options, answer, explanation, position)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  if (viewer.role !== "super_admin" && data.teacher_id !== viewer.id) return null;

  return {
    slug: data.slug,
    levelId: data.level_id,
    title: data.title as L10n,
    summary: data.summary as L10n,
    teacherId: data.teacher_id,
    teacherName: data.teacher_name,
    published: data.published,
    position: data.position,
    lessons: [...(data.lessons as LessonRow[])].sort(byPosition).map((l) => ({
      id: l.id,
      title: l.title,
      minutes: l.minutes,
      youtubeId: l.youtube_id,
    })),
    questions: [...(data.quiz_questions as QuestionRow[])].sort(byPosition).map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
    })),
  };
}

export type AdminLevel = Level & { position: number };

export async function listLevels(sb: Sb): Promise<AdminLevel[]> {
  const { data, error } = await sb.from("levels").select(LEVEL_COLUMNS).order("position");
  if (error) throw new Error(error.message);
  return (data as LevelRow[]).map((r) => ({ ...toLevel(r), position: r.position }));
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

/** Pilihan pemilik kelas: hanya untuk super admin (guru selalu pemilik kelasnya sendiri). */
export async function teacherOptions(
  sb: Sb,
  viewer: Viewer,
): Promise<{ id: string; name: string; email: string }[] | null> {
  if (viewer.role !== "super_admin") return null;
  const users = await listUsers(sb);
  return users
    .filter((u) => u.role === "teacher" || u.role === "super_admin")
    .map((u) => ({ id: u.id, name: u.name || u.email, email: u.email }));
}

/** Semua pengguna (khusus super admin; selain itu database mengembalikan daftar kosong). */
export async function listUsers(sb: Sb): Promise<AdminUser[]> {
  const { data, error } = await sb.rpc("admin_list_users");
  if (error) throw new Error(error.message);
  return (data as { id: string; name: string; email: string; role: Role; created_at: string }[]).map(
    (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.created_at }),
  );
}

export type StudentRow = {
  userId: string;
  name: string;
  lessonsDone: number;
  attempts: number;
  bestScore: number | null;
  bestTotal: number | null;
  lastActivity: string | null;
};

export async function studentReport(sb: Sb, slug: string): Promise<StudentRow[]> {
  const { data, error } = await sb.rpc("course_student_report", { p_slug: slug });
  if (error) throw new Error(error.message);
  return (
    data as {
      user_id: string;
      name: string;
      lessons_done: number;
      attempts: number;
      best_score: number | null;
      best_total: number | null;
      last_activity: string | null;
    }[]
  ).map((r) => ({
    userId: r.user_id,
    name: r.name,
    lessonsDone: r.lessons_done,
    attempts: r.attempts,
    bestScore: r.best_score,
    bestTotal: r.best_total,
    lastActivity: r.last_activity,
  }));
}

export type AdminReview = {
  id: string;
  name: string;
  levelId: string;
  rating: number;
  body: string;
  approved: boolean;
  createdAt: string;
};

export async function listReviews(sb: Sb): Promise<AdminReview[]> {
  const { data, error } = await sb
    .from("reviews")
    .select("id, name, level_id, rating, body, approved, created_at")
    .order("approved")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    levelId: r.level_id,
    rating: r.rating,
    body: r.body,
    approved: r.approved,
    createdAt: r.created_at,
  }));
}
