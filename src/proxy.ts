import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

/**
 * 1) next-intl: deteksi & redirect bahasa.
 * 2) Supabase: refresh sesi login (cookie) di setiap request.
 * Jika kunci Supabase belum diisi, hanya langkah 1 yang berjalan.
 */
export default async function proxy(request: NextRequest) {
  const response = handleI18n(request);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list, headers) {
        list.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Memverifikasi token dan me-refresh bila perlu.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  // Semua path kecuali api, _next, dan file statis (yang punya titik).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
