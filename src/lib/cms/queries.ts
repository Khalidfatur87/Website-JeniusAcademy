import type { L10n, Level, Role } from "@/lib/content";
import { LEVEL_COLUMNS, toLevel, type LevelRow } from "@/lib/content-server";
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
    .select("slug, title, level_id, published, teacher_name, position, lessons(id), quiz_questions(id)")
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
    // (count) tidak bisa dipakai: tabel ini hanya memberi izin baca per kolom.
    lessonCount: (r.lessons as { id: string }[]).length,
    questionCount: (r.quiz_questions as { id: string }[]).length,
  }));
}

export type AdminMaterial = { id: string; title: string; path: string; size: number };

export type AdminLesson = {
  id: string;
  title: L10n;
  minutes: number;
  youtubeId: string;
  notes: L10n;
  freePreview: boolean;
  materials: AdminMaterial[];
};

export type AdminQuestion = {
  id: string;
  prompt: L10n;
  options: L10n[];
  answer: number;
  explanation: L10n;
};

export type AdminCourse = {
  slug: string;
  levelId: string;
  title: L10n;
  summary: L10n;
  teacherId: string | null;
  teacherName: string;
  published: boolean;
  position: number;
  lessons: AdminLesson[];
  questions: AdminQuestion[];
};

/**
 * Kelas lengkap untuk editor; null jika tidak ada ATAU bukan milik guru ini.
 * Video, catatan, dan kunci jawaban tidak bisa dibaca langsung dari tabel —
 * dibaca lewat RPC yang memeriksa can_edit_course.
 */
export async function getEditableCourse(
  sb: Sb,
  viewer: Viewer,
  slug: string,
): Promise<AdminCourse | null> {
  const { data, error } = await sb
    .from("courses")
    .select("slug, level_id, title, summary, teacher_id, teacher_name, published, position")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  if (viewer.role !== "super_admin" && data.teacher_id !== viewer.id) return null;

  const [lessons, questions, materials] = await Promise.all([
    sb.rpc("admin_course_lessons", { p_slug: slug }),
    sb.rpc("admin_course_questions", { p_slug: slug }),
    sb
      .from("lesson_materials")
      .select("id, lesson_id, title, path, size")
      .eq("course_slug", slug)
      .order("position")
      .order("created_at"),
  ]);
  if (lessons.error) throw new Error(lessons.error.message);
  if (questions.error) throw new Error(questions.error.message);
  if (materials.error) throw new Error(materials.error.message);

  const byLesson = new Map<string, AdminMaterial[]>();
  for (const m of materials.data) {
    byLesson.set(m.lesson_id, [
      ...(byLesson.get(m.lesson_id) ?? []),
      { id: m.id, title: m.title, path: m.path, size: m.size },
    ]);
  }

  return {
    slug: data.slug,
    levelId: data.level_id,
    title: data.title as L10n,
    summary: data.summary as L10n,
    teacherId: data.teacher_id,
    teacherName: data.teacher_name,
    published: data.published,
    position: data.position,
    lessons: (
      lessons.data as {
        id: string;
        title: L10n;
        minutes: number;
        youtube_id: string;
        notes: L10n;
        free_preview: boolean;
      }[]
    ).map((l) => ({
      id: l.id,
      title: l.title,
      minutes: l.minutes,
      youtubeId: l.youtube_id,
      notes: l.notes ?? {},
      freePreview: l.free_preview,
      materials: byLesson.get(l.id) ?? [],
    })),
    questions: (questions.data as AdminQuestion[]).map((q) => ({
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

// ---- langganan (super admin) -------------------------------------------------

export type AdminSubscription = {
  userId: string;
  userName: string;
  userEmail: string;
  levelId: string;
  expiresAt: string | null;
  note: string;
  createdAt: string;
};

export async function listSubscriptions(sb: Sb, users: AdminUser[]): Promise<AdminSubscription[]> {
  const { data, error } = await sb
    .from("subscriptions")
    .select("user_id, level_id, expires_at, note, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const byId = new Map(users.map((u) => [u.id, u]));
  return data.map((r) => ({
    userId: r.user_id,
    userName: byId.get(r.user_id)?.name ?? "",
    userEmail: byId.get(r.user_id)?.email ?? "",
    levelId: r.level_id,
    expiresAt: r.expires_at,
    note: r.note,
    createdAt: r.created_at,
  }));
}

// ---- diskusi ---------------------------------------------------------------

export type OpenQuestion = {
  id: string;
  courseSlug: string;
  lessonId: string;
  courseTitle: L10n;
  lessonTitle: L10n;
  body: string;
  createdAt: string;
  authorName: string;
};

export async function listOpenQuestions(sb: Sb): Promise<OpenQuestion[]> {
  const { data, error } = await sb.rpc("admin_open_questions");
  if (error) throw new Error(error.message);
  return (
    data as {
      id: string;
      course_slug: string;
      lesson_id: string;
      course_title: L10n;
      lesson_title: L10n;
      body: string;
      created_at: string;
      author_name: string;
    }[]
  ).map((r) => ({
    id: r.id,
    courseSlug: r.course_slug,
    lessonId: r.lesson_id,
    courseTitle: r.course_title,
    lessonTitle: r.lesson_title,
    body: r.body,
    createdAt: r.created_at,
    authorName: r.author_name,
  }));
}

// ---- statistik ----------------------------------------------------------------

export type CourseStats = {
  slug: string;
  title: L10n;
  published: boolean;
  lessons: number;
  learners: number;
  completers: number;
  quizTakers: number;
  avgBestPercent: number | null;
  certificates: number;
};

export async function courseStats(sb: Sb): Promise<CourseStats[]> {
  const { data, error } = await sb.rpc("admin_course_stats");
  if (error) throw new Error(error.message);
  return (
    data as {
      slug: string;
      title: L10n;
      published: boolean;
      lessons: number;
      learners: number;
      completers: number;
      quiz_takers: number;
      avg_best_percent: number | null;
      certificates: number;
    }[]
  ).map((r) => ({
    slug: r.slug,
    title: r.title,
    published: r.published,
    lessons: r.lessons,
    learners: r.learners,
    completers: r.completers,
    quizTakers: r.quiz_takers,
    avgBestPercent: r.avg_best_percent,
    certificates: r.certificates,
  }));
}

export type FunnelStep = { lessonId: string; title: L10n; completed: number };

export async function lessonFunnel(sb: Sb, slug: string): Promise<FunnelStep[]> {
  const { data, error } = await sb.rpc("admin_lesson_funnel", { p_slug: slug });
  if (error) throw new Error(error.message);
  return (data as { lesson_id: string; title: L10n; completed: number }[]).map((r) => ({
    lessonId: r.lesson_id,
    title: r.title,
    completed: r.completed,
  }));
}

export type Overview = {
  users: number;
  newUsers30d: number;
  activeLearners7d: number;
  activeSubscriptions: number;
  pendingReviews: number;
  certificates: number;
};

/** Ringkasan situs; null untuk selain super admin. */
export async function siteOverview(sb: Sb): Promise<Overview | null> {
  const { data, error } = await sb.rpc("admin_overview");
  if (error) throw new Error(error.message);
  if (!data) return null;
  const d = data as Record<string, number>;
  return {
    users: d.users,
    newUsers30d: d.new_users_30d,
    activeLearners7d: d.active_learners_7d,
    activeSubscriptions: d.active_subscriptions,
    pendingReviews: d.pending_reviews,
    certificates: d.certificates,
  };
}

// ---- try-out -------------------------------------------------------------------

export type AdminTryout = {
  slug: string;
  levelId: string;
  title: L10n;
  description: L10n;
  published: boolean;
  opensAt: string | null;
  closesAt: string | null;
  position: number;
  sectionCount: number;
  participants: number;
};

export async function listEditableTryouts(sb: Sb, viewer: Viewer): Promise<AdminTryout[]> {
  let q = sb
    .from("tryouts")
    .select("slug, level_id, title, description, published, opens_at, closes_at, position, tryout_sections(id), tryout_attempts(id)")
    .order("position")
    .order("created_at", { ascending: false });
  if (viewer.role !== "super_admin") q = q.eq("created_by", viewer.id);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data.map((r) => ({
    slug: r.slug,
    levelId: r.level_id,
    title: r.title as L10n,
    description: r.description as L10n,
    published: r.published,
    opensAt: r.opens_at,
    closesAt: r.closes_at,
    position: r.position,
    sectionCount: (r.tryout_sections as { id: string }[]).length,
    // Hanya percobaan yang terlihat oleh RLS (milik sendiri); jumlah peserta asli lewat RPC di bawah.
    participants: (r.tryout_attempts as { id: string }[]).length,
  }));
}

export type AdminTryoutSection = {
  id: string;
  title: L10n;
  minutes: number;
  questions: AdminQuestion[];
};

export async function getEditableTryout(
  sb: Sb,
  viewer: Viewer,
  slug: string,
): Promise<(AdminTryout & { sections: AdminTryoutSection[]; locked: boolean }) | null> {
  const list = await listEditableTryouts(sb, viewer);
  const base = list.find((x) => x.slug === slug);
  if (!base) return null;
  const [content, board] = await Promise.all([
    sb.rpc("admin_tryout_content", { p_slug: slug }),
    sb.rpc("tryout_leaderboard", { p_slug: slug }),
  ]);
  if (content.error) throw new Error(content.error.message);
  const participants = board.error ? 0 : (board.data as unknown[]).length;
  return {
    ...base,
    participants: Math.max(base.participants, participants),
    sections: (content.data ?? []) as AdminTryoutSection[],
    // Isi tidak bisa diubah setelah ada peserta (nilai & peringkat tetap adil).
    locked: Math.max(base.participants, participants) > 0,
  };
}

// ---- kelas live ------------------------------------------------------------------

export type AdminLive = {
  id: string;
  levelId: string;
  courseSlug: string | null;
  title: L10n;
  description: L10n;
  startsAt: string;
  minutes: number;
  hostName: string;
  joinUrl: string;
  recordingYoutubeId: string;
};

export async function listAdminLive(sb: Sb): Promise<AdminLive[]> {
  const { data, error } = await sb.rpc("admin_live_sessions");
  if (error) throw new Error(error.message);
  return (
    data as {
      id: string;
      level_id: string;
      course_slug: string | null;
      title: L10n;
      description: L10n;
      starts_at: string;
      minutes: number;
      host_name: string;
      join_url: string;
      recording_youtube_id: string;
    }[]
  ).map((r) => ({
    id: r.id,
    levelId: r.level_id,
    courseSlug: r.course_slug,
    title: r.title,
    description: r.description,
    startsAt: r.starts_at,
    minutes: r.minutes,
    hostName: r.host_name,
    joinUrl: r.join_url,
    recordingYoutubeId: r.recording_youtube_id,
  }));
}

// ---- mode sekolah ------------------------------------------------------------------

export type AdminClassroom = {
  id: string;
  name: string;
  joinCode: string;
  sponsorLevelId: string | null;
  archived: boolean;
  createdAt: string;
  members: number;
};

export async function listClassrooms(sb: Sb, viewer: Viewer): Promise<AdminClassroom[]> {
  let q = sb
    .from("classrooms")
    .select("id, name, join_code, sponsor_level_id, archived, created_at, classroom_members(student_id)")
    .order("created_at", { ascending: false });
  // Super admin melihat semua kelas sekolah; guru hanya miliknya.
  if (viewer.role !== "super_admin") q = q.eq("teacher_id", viewer.id);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    joinCode: r.join_code,
    sponsorLevelId: r.sponsor_level_id,
    archived: r.archived,
    createdAt: r.created_at,
    members: (r.classroom_members as { student_id: string }[]).length,
  }));
}

export type AdminAssignment = {
  id: string;
  title: string;
  instructions: string;
  kind: "lesson" | "quiz" | "course";
  courseSlug: string;
  lessonId: string | null;
  dueAt: string | null;
};

export type ClassroomDetail = AdminClassroom & {
  roster: { studentId: string; name: string; joinedAt: string }[];
  assignments: AdminAssignment[];
  report: { studentId: string; assignmentId: string; status: { done: boolean; percent?: number | null; done_count?: number; total?: number } }[];
};

export async function getClassroom(sb: Sb, viewer: Viewer, id: string): Promise<ClassroomDetail | null> {
  const base = (await listClassrooms(sb, viewer)).find((c) => c.id === id);
  if (!base) return null;
  const [roster, assignments, report] = await Promise.all([
    sb.rpc("classroom_roster", { p_id: id }),
    sb
      .from("assignments")
      .select("id, title, instructions, kind, course_slug, lesson_id, due_at")
      .eq("classroom_id", id)
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    sb.rpc("classroom_report", { p_id: id }),
  ]);
  if (roster.error) throw new Error(roster.error.message);
  if (assignments.error) throw new Error(assignments.error.message);
  if (report.error) throw new Error(report.error.message);
  return {
    ...base,
    roster: (roster.data as { student_id: string; name: string; joined_at: string }[]).map((r) => ({
      studentId: r.student_id,
      name: r.name,
      joinedAt: r.joined_at,
    })),
    assignments: assignments.data.map((a) => ({
      id: a.id,
      title: a.title,
      instructions: a.instructions,
      kind: a.kind as AdminAssignment["kind"],
      courseSlug: a.course_slug,
      lessonId: a.lesson_id,
      dueAt: a.due_at,
    })),
    report: (report.data as { student_id: string; assignment_id: string; status: ClassroomDetail["report"][number]["status"] }[]).map(
      (r) => ({ studentId: r.student_id, assignmentId: r.assignment_id, status: r.status }),
    ),
  };
}
