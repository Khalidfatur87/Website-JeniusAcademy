"use client";

import { getClient, refreshProfile } from "./auth";
import { clampGoal } from "./activity";

/** Mengubah profil sendiri. RLS hanya mengizinkan kolom name, avatar_path, weekly_goal. */

export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const NAME_MAX = 80;

export type ProfileError = "nameRequired" | "nameTooLong" | "fileType" | "fileSize" | "generic";

export async function updateName(userId: string, name: string): Promise<ProfileError | null> {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) return "nameRequired";
  if (clean.length > NAME_MAX) return "nameTooLong";
  const sb = getClient();
  const { error } = await sb.from("profiles").update({ name: clean }).eq("id", userId);
  if (error) return "generic";
  // Samakan juga metadata akun (dipakai sebelum profil termuat).
  await sb.auth.updateUser({ data: { name: clean } }).catch(() => {});
  await refreshProfile();
  return null;
}

export async function updateWeeklyGoal(userId: string, goal: number): Promise<boolean> {
  const { error } = await getClient()
    .from("profiles")
    .update({ weekly_goal: clampGoal(goal) })
    .eq("id", userId);
  if (!error) await refreshProfile();
  return !error;
}

/** Unggah foto ke avatars/<id pengguna>/<waktu>.<ext>, lalu hapus foto lama. */
export async function uploadAvatar(userId: string, file: File): Promise<ProfileError | null> {
  if (!AVATAR_TYPES.includes(file.type)) return "fileType";
  if (file.size > AVATAR_MAX_BYTES) return "fileSize";
  const sb = getClient();
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { data: old } = await sb.from("profiles").select("avatar_path").eq("id", userId).maybeSingle();
  const up = await sb.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return "generic";
  const { error } = await sb.from("profiles").update({ avatar_path: path }).eq("id", userId);
  if (error) {
    await sb.storage.from("avatars").remove([path]);
    return "generic";
  }
  if (old?.avatar_path) await sb.storage.from("avatars").remove([old.avatar_path]);
  await refreshProfile();
  return null;
}

export async function removeAvatar(userId: string): Promise<boolean> {
  const sb = getClient();
  const { data: old } = await sb.from("profiles").select("avatar_path").eq("id", userId).maybeSingle();
  const { error } = await sb.from("profiles").update({ avatar_path: null }).eq("id", userId);
  if (error) return false;
  if (old?.avatar_path) await sb.storage.from("avatars").remove([old.avatar_path]);
  await refreshProfile();
  return true;
}
