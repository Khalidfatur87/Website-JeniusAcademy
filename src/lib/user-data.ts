"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Subscription } from "./access";
import { getClient, useAuth } from "./auth";
import type { L10n } from "./content";
import { isSupabaseConfigured } from "./supabase/client";

/**
 * Data milik pengguna yang login (dibaca dengan RLS), dimuat sekali per pengguna
 * dan dibagi ke semua komponen. Tamu selalu mendapat nilai kosong.
 */
function createUserResource<T>(empty: T, load: (userId: string) => Promise<T>) {
  type State = { userId: string | null; value: T; loaded: boolean };
  const EMPTY: State = { userId: null, value: empty, loaded: false };
  let state: State = EMPTY;
  let loadingFor: string | null = null;
  const listeners = new Set<() => void>();

  const set = (next: State) => {
    state = next;
    listeners.forEach((l) => l());
  };

  const fetchFor = (userId: string) => {
    loadingFor = userId;
    load(userId)
      .then((value) => loadingFor === userId && set({ userId, value, loaded: true }))
      .catch(() => loadingFor === userId && set({ userId, value: empty, loaded: true }));
  };

  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  };

  return function useResource() {
    const { user, ready } = useAuth();
    const userId = user?.id ?? null;
    const s = useSyncExternalStore(subscribe, () => state, () => EMPTY);

    useEffect(() => {
      if (!userId) {
        loadingFor = null;
        if (state !== EMPTY) set(EMPTY);
      } else if (loadingFor !== userId) {
        fetchFor(userId);
      }
    }, [userId]);

    const mine = userId !== null && s.userId === userId;
    return {
      value: mine ? s.value : empty,
      /** true setelah data pengguna ini selesai dimuat (atau pasti kosong untuk tamu). */
      loaded: ready && (userId === null || (mine && s.loaded)),
      reload: () => {
        if (userId) fetchFor(userId);
      },
    };
  };
}

// ---- langganan -----------------------------------------------------------

const EMPTY_SUBS: Subscription[] = [];

export const useSubscriptions = createUserResource(EMPTY_SUBS, async () => {
  const { data, error } = await getClient().from("subscriptions").select("level_id, expires_at");
  if (error) throw error;
  return data.map((r) => ({ levelId: r.level_id as string, expiresAt: r.expires_at as string | null }));
});

// ---- sertifikat ------------------------------------------------------------

export type MyCertificate = {
  code: string;
  courseSlug: string;
  courseTitle: L10n;
  issuedAt: string;
};

const EMPTY_CERTS: MyCertificate[] = [];

export const useCertificates = createUserResource(EMPTY_CERTS, async () => {
  const { data, error } = await getClient()
    .from("certificates")
    .select("code, course_slug, course_title, issued_at")
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return data.map((r) => ({
    code: r.code as string,
    courseSlug: r.course_slug as string,
    courseTitle: r.course_title as L10n,
    issuedAt: r.issued_at as string,
  }));
});

export type ClaimError = "notComplete" | "quizRequired" | "noAccess" | "generic";

/** Terbitkan sertifikat (atau ambil yang sudah ada). Syarat diperiksa di database. */
export async function claimCertificate(slug: string): Promise<{ code: string } | { error: ClaimError }> {
  if (!isSupabaseConfigured) return { error: "generic" };
  const { data, error } = await getClient().rpc("claim_certificate", { p_slug: slug });
  if (error) {
    const m = error.message;
    if (m.includes("not_complete")) return { error: "notComplete" };
    if (m.includes("quiz_required")) return { error: "quizRequired" };
    if (m.includes("no_access")) return { error: "noAccess" };
    return { error: "generic" };
  }
  return { code: data as string };
}
