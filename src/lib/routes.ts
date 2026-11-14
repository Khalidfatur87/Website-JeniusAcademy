import type { LevelId } from "@/config/courses";

/** Satu-satunya tempat path internal dirakit. Dipakai bersama `Link` dari @/i18n/navigation. */
export const routes = {
  home: "/",
  courses: "/courses",
  pricing: "/pricing",
  reviews: "/reviews",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  contact: "/#contact",
  coursesByLevel: (id: LevelId) => `/courses?level=${id}`,
  course: (slug: string) => `/courses/${slug}`,
  lesson: (slug: string, lessonId: string) => `/courses/${slug}/${lessonId}`,
} as const;
