"use client";

import { useTranslations } from "next-intl";

/** Tombol "Lanjutkan dengan Google" (belum tersambung ke backend). */
export function GoogleButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("auth");

  return (
    <button type="button" className="btn btn-ghost w-full" onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 01-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
        <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0012 23z" />
        <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 010-4.2V7.1H2.1a11 11 0 000 9.8l3.6-2.8z" />
        <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.3 1.7l3.2-3.2A11 11 0 002.1 7.1l3.6 2.8C6.6 7.4 9.1 5.4 12 5.4z" />
      </svg>
      {t("continueGoogle")}
    </button>
  );
}
