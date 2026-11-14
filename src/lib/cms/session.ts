import { cache } from "react";
import type { Role } from "@/lib/content";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

/**
 * Pengguna yang sedang membuka CMS (dibaca dari cookie sesi, di server).
 * Role hanya menentukan menu yang ditampilkan; izin sebenarnya dijaga RLS
 * dan fungsi database (lihat supabase/migrations/*_cms_roles.sql).
 */
export type Viewer = { id: string; name: string; email: string; role: Role };

export const getViewer = cache(async () => {
  if (!isSupabaseConfigured) return null;
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data } = await sb.from("profiles").select("name, role").eq("id", user.id).maybeSingle();
  const viewer: Viewer = {
    id: user.id,
    email: user.email ?? "",
    name: data?.name ?? user.email ?? "",
    role: (data?.role as Role | undefined) ?? "student",
  };
  return { sb, viewer };
});

export const isStaff = (role: Role) => role === "teacher" || role === "super_admin";
