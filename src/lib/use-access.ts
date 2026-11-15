"use client";

import { activeSubscription, hasCourseAccess, isFreeCourse } from "./access";
import { useAuth } from "./auth";
import type { Course } from "./content";
import { useSubscriptions } from "./user-data";

/**
 * Status akses kelas untuk tampilan (gembok, tombol).
 * `loaded` false selama sesi / langganan belum selesai dimuat — tampilkan netral dulu.
 */
export function useCourseAccess(course: Course) {
  const { user } = useAuth();
  const subs = useSubscriptions();
  const free = isFreeCourse(course);
  const viewer = user ? { id: user.id, role: user.role } : null;
  return {
    free,
    loaded: free || subs.loaded,
    access: hasCourseAccess(course, subs.value, viewer),
    subscription: activeSubscription(subs.value, course.levelId),
    signedIn: Boolean(user),
  };
}
