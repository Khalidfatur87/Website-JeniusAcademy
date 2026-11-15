"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { LessonMaterial } from "@/lib/content";
import { formatBytes } from "@/lib/format";
import { materialUrl } from "@/lib/lesson-content";

/** Daftar file materi; tautan unduh dibuat saat diklik (berlaku 1 jam). */
export function LessonMaterials({ materials }: { materials: LessonMaterial[] }) {
  const t = useTranslations("lesson");
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const open = async (m: LessonMaterial) => {
    setBusy(m.id);
    setFailed(false);
    const url = await materialUrl(m.path);
    setBusy(null);
    if (url) window.location.assign(url);
    else setFailed(true);
  };

  return (
    <section aria-labelledby="materials-heading" className="space-y-3">
      <h2 id="materials-heading" className="text-xl">
        {t("materials")}
      </h2>
      <ul className="space-y-2">
        {materials.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => void open(m)}
              disabled={busy === m.id}
              className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3.5 text-left transition hover:border-brand disabled:opacity-60"
            >
              <Icon name="file" size={20} className="shrink-0 text-brand-ink" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{m.title}</span>
                {m.size > 0 && <span className="block text-xs text-muted">{formatBytes(m.size)}</span>}
              </span>
              <Icon name="download" size={18} className="shrink-0 text-muted" />
              <span className="sr-only">{t("download")}</span>
            </button>
          </li>
        ))}
      </ul>
      {failed && (
        <p role="alert" className="text-sm text-danger">
          {t("downloadFailed")}
        </p>
      )}
    </section>
  );
}
