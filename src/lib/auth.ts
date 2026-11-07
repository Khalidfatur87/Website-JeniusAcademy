"use client";

import { createLocalStore } from "./store";

/**
 * AUTH PRATINJAU (DEMO)
 * Tidak ada server dan tidak ada kata sandi yang disimpan. Hanya nama &
 * email yang disimpan di browser agar UI bisa menampilkan status masuk.
 * Ganti modul ini saat backend (Supabase/Firebase/dll.) tersedia.
 */
export type User = { name: string; email: string };

const store = createLocalStore<User | null>("ja:user", null);

export function useAuth() {
  const user = store.useValue();
  return {
    user,
    signIn: (u: User) => store.set(u),
    signOut: () => store.set(null),
  };
}
