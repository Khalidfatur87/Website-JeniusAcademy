"use client";

import clsx from "clsx";

/** Grup tombol-pil untuk memilih satu opsi (filter jenjang, dll.). */
export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  /** Nama grup untuk pembaca layar. */
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={clsx(
            "rounded-full border px-4 py-2 text-sm font-semibold transition",
            value === opt.id
              ? "border-brand-strong bg-brand-strong text-on-brand"
              : "border-line bg-surface text-muted hover:border-brand hover:text-ink",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
