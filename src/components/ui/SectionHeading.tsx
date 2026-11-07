import clsx from "clsx";
import type { ReactNode } from "react";

/** Judul section (h2) + subjudul, dipakai seragam di halaman beranda. */
export function SectionHeading({
  title,
  subtitle,
  align = "center",
  wide,
  children,
}: {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  /** Tanpa batas lebar judul (untuk container yang sudah sempit). */
  wide?: boolean;
  /** Slot kanan (mis. tombol "lihat semua"); hanya untuk align="left". */
  children?: ReactNode;
}) {
  const heading = (
    <div className={clsx(align === "center" && "text-center", align === "center" && !wide && "mx-auto max-w-2xl")}>
      <h2 className="text-[clamp(1.8rem,4vw,2.6rem)]">{title}</h2>
      {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
    </div>
  );

  if (!children) return heading;
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      {heading}
      {children}
    </div>
  );
}
