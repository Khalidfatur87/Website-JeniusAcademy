"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";
import { localeLabels, locales } from "@/config/site";
import type { L10n } from "@/lib/content";
import type { ActionResult } from "@/lib/cms/actions";

/** Input teks per bahasa. Bahasa pertama (Indonesia) wajib; lainnya opsional. */
export function L10nInput({
  label,
  value,
  onChange,
  multiline,
  required,
  placeholder,
}: {
  label: string;
  value: L10n;
  onChange: (next: L10n) => void;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  const t = useTranslations("admin");
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1.5 text-sm font-medium">
        {label}
        {required && <span className="text-danger"> *</span>}
      </legend>
      {locales.map((loc, i) => {
        const inputId = `${id}-${loc}`;
        const common = {
          id: inputId,
          value: value[loc] ?? "",
          placeholder: i === 0 ? placeholder : t("optionalTranslation"),
          className: clsx("field", multiline && "resize-y"),
          onChange: (e: { target: { value: string } }) =>
            onChange({ ...value, [loc]: e.target.value }),
        };
        return (
          <div key={loc} className="flex items-start gap-2">
            <label
              htmlFor={inputId}
              title={localeLabels[loc].label}
              className="mt-2.5 w-8 shrink-0 text-xs font-bold text-muted"
            >
              {localeLabels[loc].short}
            </label>
            {multiline ? <textarea rows={3} {...common} /> : <input {...common} />}
          </div>
        );
      })}
    </fieldset>
  );
}

/** Label + input sederhana. */
export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export type Status = "idle" | "saving" | "saved" | ActionResult;

/** Pesan status simpan / galat (dengan nomor baris untuk daftar). */
export function SaveStatus({ status, rowLabel }: { status: Status; rowLabel?: string }) {
  const t = useTranslations("admin");
  if (status === "idle") return <span role="status" />;
  if (status === "saving") return <span role="status" className="text-sm text-muted">{t("saving")}</span>;
  if (status === "saved" || status.ok) {
    return (
      <span role="status" className="text-sm font-medium text-success">
        {t("saved")}
      </span>
    );
  }
  const { code, index } = status.error;
  const msg = t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.generic");
  return (
    <span role="alert" className="text-sm font-medium text-danger">
      {index !== undefined && `${rowLabel ?? t("row")} ${index + 1}: `}
      {msg}
    </span>
  );
}

/** Tombol ikon kecil (naik/turun/hapus) untuk baris daftar. */
export function RowButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "grid size-9 place-items-center rounded-lg border border-line bg-surface text-sm transition disabled:opacity-40",
        danger ? "hover:border-danger hover:text-danger" : "hover:border-brand",
      )}
    >
      {children}
    </button>
  );
}

/** Memindahkan elemen daftar satu langkah ke atas (-1) atau bawah (+1). */
export function move<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const to = index + delta;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

export const emptyL10n = (): L10n =>
  Object.fromEntries(locales.map((l) => [l, ""])) as L10n;
