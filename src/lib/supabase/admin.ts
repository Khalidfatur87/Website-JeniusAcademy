import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase dengan kunci RAHASIA (service role) — HANYA untuk tugas
 * terjadwal di server (src/app/api/cron/*). Melewati RLS; jangan pernah
 * diimpor dari komponen client. Env: SUPABASE_SECRET_KEY (tanpa NEXT_PUBLIC_).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Tugas terjadwal Vercel mengirim `Authorization: Bearer <CRON_SECRET>`. */
export function isCronRequest(req: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`;
}
