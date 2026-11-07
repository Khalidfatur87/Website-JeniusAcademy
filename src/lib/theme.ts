"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-script";

const root = () => document.documentElement;
const isDark = () => root().classList.contains("dark");

const stored = (): "light" | "dark" | null => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
};

const subscribe = (cb: () => void) => {
  // Ubahan class <html> (dari toggle ini atau tab lain lewat event storage).
  const mo = new MutationObserver(cb);
  mo.observe(root(), { attributes: true, attributeFilter: ["class"] });

  // Ikuti preferensi sistem selama pengguna belum memilih manual.
  const mql = matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    if (!stored()) root().classList.toggle("dark", mql.matches);
  };
  mql.addEventListener("change", onSystem);

  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_KEY) return;
    const v = stored();
    root().classList.toggle("dark", v ? v === "dark" : mql.matches);
  };
  window.addEventListener("storage", onStorage);

  return () => {
    mo.disconnect();
    mql.removeEventListener("change", onSystem);
    window.removeEventListener("storage", onStorage);
  };
};

/** Tema saat ini + pengganti. Server/hydration awal dianggap terang. */
export function useTheme() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  const setTheme = (theme: "light" | "dark") => {
    root().classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Storage tidak tersedia: tema hanya berlaku untuk sesi ini.
    }
  };

  return { dark, setTheme };
}
