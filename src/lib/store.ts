"use client";

import { useSyncExternalStore } from "react";

/**
 * Store kecil berbasis localStorage yang aman untuk SSR/hydration:
 * server & render pertama memakai `initial`, lalu sinkron ke storage.
 * Semua akses localStorage dibungkus try/catch (mode privat, dll.).
 */
export function createLocalStore<T>(key: string, initial: T) {
  const listeners = new Set<() => void>();
  let cache: { raw: string | null; value: T } = { raw: null, value: initial };

  const read = (): T => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return cache.value;
    }
    if (raw === cache.raw) return cache.value;
    let value = initial;
    if (raw !== null) {
      try {
        value = JSON.parse(raw) as T;
      } catch {
        value = initial;
      }
    }
    cache = { raw, value };
    return value;
  };

  const notify = () => listeners.forEach((l) => l());

  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) cb();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  };

  const set = (next: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Storage tidak tersedia: perubahan hanya berlaku di memori.
      cache = { raw: JSON.stringify(next), value: next };
    }
    notify();
  };

  const useValue = () => useSyncExternalStore(subscribe, read, () => initial);

  return { useValue, set, get: read };
}
