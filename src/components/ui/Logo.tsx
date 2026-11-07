import Image from "next/image";
import { siteConfig } from "@/config/site";

/**
 * Logo situs. Jika `siteConfig.logo.src` diisi, gambar dipakai;
 * jika tidak, tampil wordmark teks (PLACEHOLDER).
 */
export function Logo({
  className,
  onDark,
}: {
  className?: string;
  /** Dipakai di atas latar berwarna brand agar teks tetap terbaca. */
  onDark?: boolean;
}) {
  const { logo, name, wordmark } = siteConfig;

  if (logo.src) {
    return (
      <Image
        src={logo.src}
        alt={name}
        width={logo.width}
        height={logo.height}
        priority
        className={className}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 text-xl font-bold tracking-tight ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className={`grid size-9 place-items-center rounded-xl shadow-glow ${onDark ? "bg-white text-brand-strong" : "bg-brand-strong text-on-brand"}`}
      >
        {wordmark.first[0]}
      </span>
      <span>
        {wordmark.first}
        <span className={onDark ? "text-white/80" : "text-brand-ink"}>
          {wordmark.second}
        </span>
      </span>
    </span>
  );
}
