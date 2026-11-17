import Image from "next/image";
import { siteConfig } from "@/config/site";

/**
 * Logo situs: simbol (`siteConfig.logo.mark`) + tulisan nama situs.
 * Jika `siteConfig.logo.src` (logo lengkap) diisi, gambar itu yang dipakai.
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
      {logo.mark.src ? (
        // Di atas latar berwarna brand, simbol diberi alas putih agar tetap kontras.
        <span aria-hidden="true" className={onDark ? "grid h-10 place-items-center rounded-xl bg-white px-1.5" : "contents"}>
          <Image
            src={logo.mark.src}
            alt=""
            width={logo.mark.width}
            height={logo.mark.height}
            priority
            className="h-9 w-auto"
          />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={`grid size-9 place-items-center rounded-xl shadow-glow ${onDark ? "bg-white text-brand-strong" : "bg-brand-strong text-on-brand"}`}
        >
          {wordmark.first[0]}
        </span>
      )}
      <span>
        {wordmark.first}
        <span className={onDark ? "text-white/80" : "text-brand-ink"}>
          {wordmark.second}
        </span>
      </span>
    </span>
  );
}
