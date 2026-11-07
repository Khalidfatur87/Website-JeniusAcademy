/** Validasi form auth sebagai fungsi murni: mengembalikan kunci pesan (bukan teks). */
export type AuthMode = "login" | "register" | "forgot";

export type AuthValues = {
  name: string;
  email: string;
  password: string;
  confirm: string;
};

export type AuthErrorKey =
  | "name"
  | "emailRequired"
  | "emailInvalid"
  | "passwordRequired"
  | "passwordShort"
  | "confirmMismatch";

export type AuthErrors = Partial<
  Record<"name" | "email" | "password" | "confirm", AuthErrorKey>
>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD = 8;

export function validateAuth(mode: AuthMode, v: AuthValues): AuthErrors {
  const e: AuthErrors = {};
  if (mode === "register" && !v.name.trim()) e.name = "name";

  const email = v.email.trim();
  if (!email) e.email = "emailRequired";
  else if (!EMAIL_RE.test(email)) e.email = "emailInvalid";

  if (mode !== "forgot") {
    if (!v.password) e.password = "passwordRequired";
    else if (v.password.length < MIN_PASSWORD) e.password = "passwordShort";
  }
  if (mode === "register" && v.confirm !== v.password) e.confirm = "confirmMismatch";
  return e;
}

/** 0 = kosong, 1 = lemah, 2 = cukup, 3 = kuat. */
export function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= MIN_PASSWORD) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.max(1, score) as 1 | 2 | 3;
}
