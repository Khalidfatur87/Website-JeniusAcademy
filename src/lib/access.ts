import type { Course, Lesson, Role } from "./content";

/**
 * HAK AKSES KELAS (fungsi murni) — hanya untuk tampilan (ikon gembok, tombol).
 * Penjaga sebenarnya ada di database: `has_course_access` / `has_lesson_access`
 * menentukan apakah video, materi, kuis, dan diskusi dikirim.
 */
export type Subscription = {
  levelId: string;
  /** ISO; null = tanpa batas waktu. */
  expiresAt: string | null;
};

export type Viewer = { id: string; role: Role } | null;

export const isFreeCourse = (course: Course) => course.level.price === 0;

export function isActive(sub: Subscription, now: Date = new Date()) {
  return sub.expiresAt === null || new Date(sub.expiresAt) > now;
}

/** Langganan aktif untuk satu jenjang (yang berakhir paling lama). */
export function activeSubscription(
  subs: Subscription[],
  levelId: string,
  now: Date = new Date(),
): Subscription | undefined {
  return subs
    .filter((s) => s.levelId === levelId && isActive(s, now))
    .sort((a, b) =>
      a.expiresAt === null ? -1 : b.expiresAt === null ? 1 : b.expiresAt.localeCompare(a.expiresAt),
    )[0];
}

/** Akses penuh ke kelas: gratis, berlangganan, super admin, atau guru pemiliknya. */
export function hasCourseAccess(
  course: Course,
  subs: Subscription[],
  viewer: Viewer,
  now: Date = new Date(),
) {
  if (isFreeCourse(course)) return true;
  if (viewer?.role === "super_admin") return true;
  if (viewer?.role === "teacher" && course.teacherId === viewer.id) return true;
  return Boolean(activeSubscription(subs, course.levelId, now));
}

export const isLessonOpen = (lesson: Lesson, courseAccess: boolean) =>
  courseAccess || lesson.freePreview;

/** Pelajaran pratinjau pertama (untuk tombol "Coba gratis"). */
export const firstPreview = (course: Course) => course.lessons.find((l) => l.freePreview);
