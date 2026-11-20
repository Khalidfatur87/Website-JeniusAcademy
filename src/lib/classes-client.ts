"use client";

import { getClient } from "./auth";
import type { L10n } from "./content";

/** Mode sekolah untuk siswa: gabung dengan kode, tugas, keluar kelas. */

export type JoinError = "invalidCode" | "ownClass" | "generic";

export async function joinClassroom(code: string): Promise<{ name: string } | { error: JoinError }> {
  const { data, error } = await getClient().rpc("join_classroom", { p_code: code });
  if (error) {
    if (error.message.includes("invalid_code")) return { error: "invalidCode" };
    if (error.message.includes("own_class")) return { error: "ownClass" };
    return { error: "generic" };
  }
  return { name: data.name as string };
}

export type MyClassroom = { id: string; name: string; joinedAt: string };

export async function getMyClassrooms(userId: string): Promise<MyClassroom[]> {
  const { data, error } = await getClient()
    .from("classroom_members")
    .select("classroom_id, joined_at, classrooms(name)")
    .eq("student_id", userId)
    .order("joined_at", { ascending: false });
  if (error) return [];
  return data.map((r) => ({
    id: r.classroom_id as string,
    name: ((r.classrooms as unknown as { name: string } | null)?.name ?? "-") as string,
    joinedAt: r.joined_at as string,
  }));
}

export async function leaveClassroom(classroomId: string, userId: string) {
  const { error } = await getClient()
    .from("classroom_members")
    .delete()
    .eq("classroom_id", classroomId)
    .eq("student_id", userId);
  return !error;
}

export type MyAssignment = {
  id: string;
  classroomName: string;
  title: string;
  instructions: string;
  kind: "lesson" | "quiz" | "course";
  courseSlug: string;
  courseTitle: L10n;
  lessonId: string | null;
  dueAt: string | null;
  status: { done: boolean; percent?: number | null; done_count?: number; total?: number };
};

export async function getMyAssignments(): Promise<MyAssignment[]> {
  const { data, error } = await getClient().rpc("my_assignments");
  if (error) return [];
  return (
    data as {
      id: string;
      classroom_name: string;
      title: string;
      instructions: string;
      kind: MyAssignment["kind"];
      course_slug: string;
      course_title: L10n;
      lesson_id: string | null;
      due_at: string | null;
      status: MyAssignment["status"];
    }[]
  ).map((r) => ({
    id: r.id,
    classroomName: r.classroom_name,
    title: r.title,
    instructions: r.instructions,
    kind: r.kind,
    courseSlug: r.course_slug,
    courseTitle: r.course_title,
    lessonId: r.lesson_id,
    dueAt: r.due_at,
    status: r.status ?? { done: false },
  }));
}
