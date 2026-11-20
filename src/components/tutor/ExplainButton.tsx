"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import type { TutorError } from "@/lib/tutor";
import { askTutor } from "@/lib/tutor-client";

/** "Jelaskan dengan AI" untuk satu soal kuis yang sudah dinilai. */
export function ExplainButton({ questionId, chosen }: { questionId: string; chosen: number | undefined }) {
  const t = useTranslations("tutor");
  const locale = useLocale();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TutorError | null>(null);

  if (!siteConfig.features.tutorAi) return null;

  const run = async () => {
    setBusy(true);
    setError(null);
    setText("");
    const result = await askTutor(
      { mode: "quiz", questionId, chosen: chosen ?? null, locale },
      (chunk) => setText((s) => s + chunk),
    );
    setBusy(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <div className="space-y-2">
      {!text && (
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline disabled:opacity-60"
        >
          <Icon name="sparkles" size={16} />
          {busy ? t("thinking") : t("explain")}
        </button>
      )}
      {text && (
        <div className="whitespace-pre-line break-words rounded-xl border border-accent/40 bg-accent/5 p-3 text-sm leading-relaxed" aria-live="polite">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Icon name="sparkles" size={14} />
            {t("tutor")}
          </p>
          {text}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {t(`errors.${error}`, { limit: siteConfig.ai.dailyLimit })}
        </p>
      )}
    </div>
  );
}
