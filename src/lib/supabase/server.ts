import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Client Supabase untuk Server Component, Server Action, dan route handler. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component tidak bisa menulis cookie; proxy yang me-refresh sesi.
          }
        },
      },
    },
  );
}

/** Token dari header `Authorization: Bearer <token>` (aplikasi mobile), atau null. */
export function bearerToken(req: Request): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") ?? "");
  return m ? m[1] : null;
}

/**
 * Client untuk route handler yang dipanggil website (cookie) DAN aplikasi mobile
 * (Bearer). Dengan Bearer, semua kueri berjalan sebagai pengguna itu, jadi RLS &
 * fungsi database tetap berlaku sama persis. `token` diteruskan ke getClaims().
 */
export async function createClientForRequest(req: Request) {
  const token = bearerToken(req);
  if (!token) return { sb: await createClient(), token: undefined };
  const sb = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return { sb, token };
}
