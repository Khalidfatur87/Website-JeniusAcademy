import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Tujuan tautan email (konfirmasi, reset sandi) dan login Google.
 * Menukar `code` menjadi sesi (cookie), lalu mengarahkan ke `next`.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  const next = safeNext(searchParams.get("next"), locale, `/${locale}/courses`);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL(`/${locale}/login`, origin));
}
