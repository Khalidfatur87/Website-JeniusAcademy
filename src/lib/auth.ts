"use client";

import type { AuthError, User as SupabaseUser } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { createClient, isSupabaseConfigured } from "./supabase/client";

/**
 * AUTH — Supabase Auth.
 * Satu store bersama untuk semua komponen: sesi dibaca sekali lewat
 * onAuthStateChange, lalu disebarkan ke setiap pemanggil useAuth().
 */
export type User = { id: string; name: string; email: string };
export type AuthState = { user: User | null; ready: boolean };

/** Kunci pesan galat (diterjemahkan di `auth.errors.*`). */
export type AuthFailure =
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "alreadyRegistered"
  | "rateLimited"
  | "weakPassword"
  | "sessionMissing"
  | "notConfigured"
  | "generic";

export type AuthResult = { error?: AuthFailure };
export type SignUpResult = AuthResult & { needsConfirmation?: boolean };

// ---- store ---------------------------------------------------------------

const SERVER_STATE: AuthState = { user: null, ready: false };
let state: AuthState = SERVER_STATE;
let started = false;
const listeners = new Set<() => void>();

function setState(next: AuthState) {
  const a = state.user;
  const b = next.user;
  const same =
    state.ready === next.ready &&
    a?.id === b?.id &&
    a?.name === b?.name &&
    a?.email === b?.email;
  if (same) return;
  state = next;
  listeners.forEach((l) => l());
}

function toUser(u: SupabaseUser): User {
  const meta = u.user_metadata ?? {};
  const email = u.email ?? "";
  return {
    id: u.id,
    email,
    name: meta.name || meta.full_name || email.split("@")[0] || "",
  };
}

let client: ReturnType<typeof createClient> | undefined;
const getClient = () => (client ??= createClient());

function start() {
  if (started) return;
  started = true;
  if (!isSupabaseConfigured) {
    setState({ user: null, ready: true });
    return;
  }
  // Event pertama (INITIAL_SESSION) memberi sesi awal.
  getClient().auth.onAuthStateChange((_event, session) => {
    setState({ user: session ? toUser(session.user) : null, ready: true });
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  start();
  return () => {
    listeners.delete(cb);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => SERVER_STATE;

// ---- aksi ----------------------------------------------------------------

function mapError(error: AuthError): AuthFailure {
  switch (error.code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "user_already_exists":
    case "email_exists":
      return "alreadyRegistered";
    case "weak_password":
      return "weakPassword";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
  }
  if (error.name === "AuthSessionMissingError") return "sessionMissing";
  if (error.status === 429) return "rateLimited";
  return "generic";
}

/** URL tujuan tautan email / OAuth: route /[locale]/auth/callback. */
function callbackUrl(locale: string, next: string) {
  return `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(next)}`;
}

async function guarded<T extends AuthResult>(run: () => Promise<T>): Promise<T | AuthResult> {
  if (!isSupabaseConfigured) return { error: "notConfigured" };
  try {
    return await run();
  } catch {
    return { error: "generic" };
  }
}

async function signUp(
  v: { name: string; email: string; password: string },
  locale: string,
): Promise<SignUpResult> {
  return guarded<SignUpResult>(async () => {
    const { data, error } = await getClient().auth.signUp({
      email: v.email,
      password: v.password,
      options: {
        data: { name: v.name },
        emailRedirectTo: callbackUrl(locale, `/${locale}/courses`),
      },
    });
    if (error) return { error: mapError(error) };
    // Email sudah terdaftar: Supabase tidak mengembalikan galat, identities kosong.
    if (data.user && data.user.identities?.length === 0) {
      return { error: "alreadyRegistered" };
    }
    return { needsConfirmation: !data.session };
  });
}

async function signIn(v: { email: string; password: string }): Promise<AuthResult> {
  return guarded(async () => {
    const { error } = await getClient().auth.signInWithPassword(v);
    return error ? { error: mapError(error) } : {};
  });
}

async function signInWithGoogle(locale: string): Promise<AuthResult> {
  return guarded(async () => {
    const { error } = await getClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl(locale, `/${locale}/courses`) },
    });
    return error ? { error: mapError(error) } : {};
  });
}

async function sendPasswordReset(email: string, locale: string): Promise<AuthResult> {
  return guarded(async () => {
    const { error } = await getClient().auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl(locale, `/${locale}/reset-password`),
    });
    return error ? { error: mapError(error) } : {};
  });
}

async function updatePassword(password: string): Promise<AuthResult> {
  return guarded(async () => {
    const { error } = await getClient().auth.updateUser({ password });
    return error ? { error: mapError(error) } : {};
  });
}

async function signOut() {
  if (!isSupabaseConfigured) return;
  await getClient().auth.signOut();
}

const actions = {
  signUp,
  signIn,
  signInWithGoogle,
  sendPasswordReset,
  updatePassword,
  signOut,
};

export function useAuth() {
  const { user, ready } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { user, ready, ...actions };
}
