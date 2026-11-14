"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { useRouter } from "@/i18n/navigation";
import { deleteLevel, saveLevel } from "@/lib/cms/actions";
import type { AdminLevel } from "@/lib/cms/queries";
import type { L10n } from "@/lib/content";
import { emptyL10n, Field, L10nInput, RowButton, SaveStatus, type Status } from "./fields";

type Draft = {
  id: string;
  name: L10n;
  tagline: L10n;
  price: number;
  originalPrice: string;
  featured: boolean;
  subjects: L10n[];
  color: string;
  position: number;
};

const toDraft = (l: AdminLevel): Draft => ({
  id: l.id,
  name: l.name,
  tagline: l.tagline,
  price: l.price,
  originalPrice: l.originalPrice ? String(l.originalPrice) : "",
  featured: Boolean(l.featured),
  subjects: l.subjects,
  color: l.color,
  position: l.position,
});

function LevelCard({ initial, isNew, onDone }: { initial: Draft; isNew: boolean; onDone?: () => void }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const id = useId();
  const [d, setD] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));

  const save = () => {
    setStatus("saving");
    start(async () => {
      const result = await saveLevel(
        { ...d, originalPrice: d.originalPrice.trim() ? Number(d.originalPrice) : null },
        isNew ? "create" : "update",
      );
      setStatus(result);
      if (result.ok) {
        onDone?.();
        router.refresh();
      }
    });
  };

  const remove = () => {
    if (!window.confirm(t("levels.confirmDelete", { id: d.id }))) return;
    start(async () => {
      const result = await deleteLevel(d.id);
      setStatus(result);
      if (result.ok) router.refresh();
    });
  };

  return (
    <div className="card space-y-5 p-6" style={{ borderTop: `4px solid ${d.color}` }}>
      <div className="grid gap-5 sm:grid-cols-[1fr_8rem_8rem]">
        <Field label={t("levels.id")} htmlFor={`${id}-id`} hint={isNew ? t("levels.idHint") : t("levels.idLocked")}>
          <input
            id={`${id}-id`}
            className="field font-mono"
            value={d.id}
            disabled={!isNew}
            onChange={(e) => set({ id: e.target.value.toLowerCase() })}
          />
        </Field>
        <Field label={t("levels.color")} htmlFor={`${id}-color`}>
          <input
            id={`${id}-color`}
            type="color"
            className="field h-11 cursor-pointer p-1"
            value={d.color}
            onChange={(e) => set({ color: e.target.value })}
          />
        </Field>
        <Field label={t("course.position")} htmlFor={`${id}-pos`}>
          <input
            id={`${id}-pos`}
            type="number"
            className="field"
            value={d.position}
            onChange={(e) => set({ position: Number(e.target.value) })}
          />
        </Field>
      </div>

      <L10nInput label={t("levels.name")} value={d.name} onChange={(name) => set({ name })} required />
      <L10nInput label={t("levels.tagline")} value={d.tagline} onChange={(tagline) => set({ tagline })} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("levels.price")} htmlFor={`${id}-price`} hint={t("levels.priceHint")}>
          <input
            id={`${id}-price`}
            type="number"
            min={0}
            step={1000}
            className="field"
            value={d.price}
            onChange={(e) => set({ price: Number(e.target.value) })}
          />
        </Field>
        <Field label={t("levels.originalPrice")} htmlFor={`${id}-oprice`} hint={t("levels.originalPriceHint")}>
          <input
            id={`${id}-oprice`}
            type="number"
            min={0}
            step={1000}
            className="field"
            value={d.originalPrice}
            onChange={(e) => set({ originalPrice: e.target.value })}
          />
        </Field>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={d.featured}
          onChange={(e) => set({ featured: e.target.checked })}
          className="size-4 accent-[var(--brand)]"
        />
        <span className="font-medium">{t("levels.featured")}</span>
      </label>

      <fieldset className="space-y-3">
        <legend className="mb-1.5 text-sm font-medium">{t("levels.subjects")}</legend>
        {d.subjects.map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1">
              <L10nInput
                label={`${t("levels.subject")} ${i + 1}`}
                value={s}
                onChange={(v) => set({ subjects: d.subjects.map((x, j) => (j === i ? v : x)) })}
              />
            </div>
            <div className="pt-7">
              <RowButton
                label={t("delete")}
                onClick={() => set({ subjects: d.subjects.filter((_, j) => j !== i) })}
                danger
              >
                <Icon name="x" size={14} />
              </RowButton>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set({ subjects: [...d.subjects, emptyL10n()] })}
          className="text-sm font-semibold text-brand-ink hover:underline"
        >
          + {t("levels.addSubject")}
        </button>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="btn btn-primary">
          {isNew ? t("levels.create") : t("save")}
        </button>
        {!isNew && (
          <button type="button" onClick={remove} disabled={pending} className="btn btn-ghost text-danger">
            {t("delete")}
          </button>
        )}
        <SaveStatus status={status} />
      </div>
    </div>
  );
}

export function LevelsEditor({ levels }: { levels: AdminLevel[] }) {
  const t = useTranslations("admin");
  const [adding, setAdding] = useState(false);
  const nextPosition = levels.reduce((m, l) => Math.max(m, l.position + 1), 0);

  return (
    <div className="space-y-6">
      {levels.map((l) => (
        // key menyertakan data supaya form dimuat ulang setelah tersimpan.
        <LevelCard key={`${l.id}-${JSON.stringify(l)}`} initial={toDraft(l)} isNew={false} />
      ))}

      {adding ? (
        <LevelCard
          isNew
          onDone={() => setAdding(false)}
          initial={{
            id: "",
            name: emptyL10n(),
            tagline: emptyL10n(),
            price: 0,
            originalPrice: "",
            featured: false,
            subjects: [],
            color: "#0085FF",
            position: nextPosition,
          }}
        />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="btn btn-ghost">
          + {t("levels.add")}
        </button>
      )}
    </div>
  );
}
