"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useId, useState, type Dispatch, type DragEvent, type ReactNode, type SetStateAction } from "react";
import { Icon } from "@/components/ui/Icon";
import { reorder } from "@/lib/list";
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

export { move } from "@/lib/list";

/**
 * Drag-and-drop untuk daftar di CMS (mouse/trackpad). Yang bisa diseret hanya
 * pegangannya (gambar seret memakai seluruh kartu), supaya teks di dalam input
 * tetap bisa diseleksi. Tombol ↑/↓ tetap tersedia untuk keyboard dan layar sentuh.
 */
export function useDragSort<T>(setRows: Dispatch<SetStateAction<T[]>>) {
  const [from, setFrom] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const clear = () => {
    setFrom(null);
    setOver(null);
  };

  const item = (i: number) => ({
    onDragOver: (e: DragEvent) => {
      if (from === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (over !== i) setOver(i);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      if (from !== null && from !== i) setRows((r) => reorder(r, from, i));
      clear();
    },
    className: clsx(from === i && "opacity-50", over === i && from !== null && from !== i && "ring-2 ring-brand"),
  });

  const handle = (i: number) => ({
    draggable: true,
    onDragStart: (e: DragEvent<HTMLElement>) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(i));
      const card = e.currentTarget.closest("li");
      if (card) e.dataTransfer.setDragImage(card, 24, 24);
      setFrom(i);
    },
    onDragEnd: clear,
  });

  return { item, handle };
}

/** Pegangan seret (ikon titik-titik). */
export function DragHandle({ label, ...props }: { label: string } & ReturnType<ReturnType<typeof useDragSort>["handle"]>) {
  return (
    <span
      {...props}
      title={label}
      aria-hidden="true"
      className="hidden cursor-grab select-none rounded-lg p-1.5 text-muted hover:bg-surface-2 active:cursor-grabbing md:inline-grid"
    >
      <Icon name="grip" size={18} />
    </span>
  );
}

export const emptyL10n = (): L10n =>
  Object.fromEntries(locales.map((l) => [l, ""])) as L10n;
