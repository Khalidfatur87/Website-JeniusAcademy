"use client";

import { useCallback, useEffect, useState } from "react";
import type { LevelId } from "@/config/courses";
import type { Review } from "@/config/reviews";
import { locales } from "@/config/site";
import { useAuth } from "./auth";
import { createClient, isSupabaseConfigured } from "./supabase/client";

/**
 * ULASAN dari tabel `reviews` (Supabase).
 * RLS mengembalikan ulasan yang sudah disetujui (semua orang) ditambah
 * ulasan milik pengguna yang login (termasuk yang masih menunggu).
 */
export type DbReview = Review & { mine: boolean; pending: boolean };

export type ReviewInput = {
  name: string;
  levelId: LevelId;
  rating: Review["rating"];
  body: string;
};

type Row = {
  id: string;
  user_id: string | null;
  name: string;
  level_id: LevelId;
  rating: Review["rating"];
  body: string;
  approved: boolean;
  created_at: string;
};

const COLUMNS = "id, user_id, name, level_id, rating, body, approved, created_at";

function toReview(r: Row, userId: string | null): DbReview {
  return {
    id: r.id,
    name: r.name,
    levelId: r.level_id,
    rating: r.rating,
    date: r.created_at.slice(0, 10),
    // Ulasan ditulis dalam satu bahasa; dipakai untuk semua bahasa.
    text: Object.fromEntries(locales.map((l) => [l, r.body])) as Review["text"],
    mine: userId !== null && r.user_id === userId,
    pending: !r.approved,
  };
}

export function useUserReviews() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [reviews, setReviews] = useState<DbReview[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    createClient()
      .from("reviews")
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        // Tabel belum ada / gagal: tampilkan ulasan awal saja.
        setReviews(error || !data ? [] : (data as Row[]).map((r) => toReview(r, userId)));
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  /** Mengirim ulasan baru (menunggu persetujuan). Mengembalikan true jika berhasil. */
  const add = useCallback(
    async (input: ReviewInput): Promise<boolean> => {
      if (!isSupabaseConfigured || !userId) return false;
      const { data, error } = await createClient()
        .from("reviews")
        .insert({
          user_id: userId,
          name: input.name,
          level_id: input.levelId,
          rating: input.rating,
          body: input.body,
        })
        .select(COLUMNS)
        .single();
      if (error || !data) return false;
      setReviews((prev) => [toReview(data as Row, userId), ...prev]);
      return true;
    },
    [userId],
  );

  return { reviews, add };
}
