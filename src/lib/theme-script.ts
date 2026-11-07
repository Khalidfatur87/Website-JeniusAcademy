export const THEME_KEY = "ja:theme";

/**
 * Script yang dijalankan sebelum render pertama (dirender di <head> oleh
 * layout server) agar tidak ada kilatan tema salah. Sengaja bukan bagian
 * dari komponen client: React 19 memperingatkan tag <script> di sana.
 */
export const themeInitScript = `(function(){try{var s=localStorage.getItem("${THEME_KEY}");var d=s?s==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;
