"use client";

import { createLocalStore } from "./store";

type ProgressMap = Record<string, string[]>; // courseSlug -> id pelajaran selesai

const empty: ProgressMap = {};
const store = createLocalStore<ProgressMap>("ja:progress", empty);

export function useProgress() {
  const map = store.useValue();

  const doneIds = (slug: string) => map[slug] ?? [];
  const isDone = (slug: string, lessonId: string) =>
    doneIds(slug).includes(lessonId);

  const toggle = (slug: string, lessonId: string) => {
    const current = store.get();
    const list = current[slug] ?? [];
    const next = list.includes(lessonId)
      ? list.filter((id) => id !== lessonId)
      : [...list, lessonId];
    store.set({ ...current, [slug]: next });
  };

  const markDone = (slug: string, lessonId: string) => {
    const current = store.get();
    const list = current[slug] ?? [];
    if (list.includes(lessonId)) return;
    store.set({ ...current, [slug]: [...list, lessonId] });
  };

  return { doneIds, isDone, toggle, markDone };
}
