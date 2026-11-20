"use client";

import { useEffect } from "react";

/** Mendaftarkan /sw.js (hanya build produksi, supaya cache tidak mengganggu saat pengembangan). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
