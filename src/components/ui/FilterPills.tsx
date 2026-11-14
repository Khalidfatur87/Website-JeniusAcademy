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
    // Mobile: satu baris yang bisa digeser (selebar layar); layar lebar: membungkus.
    <div
      role="group"
      aria-label={label}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={clsx(
            "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition",
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
