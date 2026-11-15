"use client";

import { avatarUrl, getClient } from "./auth";
import type { Role } from "./content";

/** Diskusi / tanya jawab per pelajaran. Hanya yang berhak atas pelajaran itu yang bisa membaca & menulis (RLS). */
export type LessonComment = {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  authorName: string;
  authorAvatar: string | null;
  authorRole: Role;
  isMine: boolean;
  canDelete: boolean;
};

export const COMMENT_MAX = 2000;

export async function listComments(slug: string, lessonId: string): Promise<LessonComment[]> {
  const { data, error } = await getClient().rpc("lesson_comments_list", {
    p_slug: slug,
    p_lesson: lessonId,
  });
  if (error) throw error;
  return (
    data as {
      id: string;
      parent_id: string | null;
      body: string;
      created_at: string;
      author_name: string;
      author_avatar: string | null;
      author_role: Role;
      is_mine: boolean;
      can_delete: boolean;
    }[]
  ).map((r) => ({
    id: r.id,
    parentId: r.parent_id,
    body: r.body,
    createdAt: r.created_at,
    authorName: r.author_name,
    authorAvatar: avatarUrl(r.author_avatar),
    authorRole: r.author_role,
    isMine: r.is_mine,
    canDelete: r.can_delete,
  }));
}

export async function postComment(
  userId: string,
  slug: string,
  lessonId: string,
  body: string,
  parentId: string | null,
): Promise<boolean> {
  const text = body.trim();
  if (!text || text.length > COMMENT_MAX) return false;
  const { error } = await getClient().from("lesson_comments").insert({
    course_slug: slug,
    lesson_id: lessonId,
    user_id: userId,
    parent_id: parentId,
    body: text,
  });
  return !error;
}

export async function deleteComment(id: string): Promise<boolean> {
  const { error } = await getClient().from("lesson_comments").delete().eq("id", id);
  return !error;
}

/** Pertanyaan + balasannya, urut waktu. */
export function threads(list: LessonComment[]) {
  const replies = new Map<string, LessonComment[]>();
  for (const c of list) {
    if (c.parentId) replies.set(c.parentId, [...(replies.get(c.parentId) ?? []), c]);
  }
  return list
    .filter((c) => !c.parentId)
    .map((q) => ({ question: q, replies: replies.get(q.id) ?? [] }));
}
