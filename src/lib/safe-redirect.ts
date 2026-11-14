/**
 * Menentukan tujuan redirect setelah login/konfirmasi email.
 * Hanya path internal berawalan `/<locale>/` yang diterima — selain itu
 * kembali ke `fallback`. Mencegah open redirect (mis. `//evil.com`, `/\evil.com`).
 */
export function safeNext(
  requested: string | null | undefined,
  locale: string,
  fallback: string,
) {
  if (!requested) return fallback;
  if (!requested.startsWith(`/${locale}/`)) return fallback;
  if (requested.includes("\\") || requested.includes("//")) return fallback;
  return requested;
}
