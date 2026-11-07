"use client";

import type { Review } from "@/config/reviews";
import { createLocalStore } from "./store";

const empty: Review[] = [];
const store = createLocalStore<Review[]>("ja:reviews", empty);

export function useUserReviews() {
  const reviews = store.useValue();
  return {
    reviews,
    add: (review: Review) => store.set([review, ...store.get()]),
  };
}
