import { siteConfig } from "@/config/site";

export function formatPrice(amount: number, locale: string) {
  return new Intl.NumberFormat(
    locale === "id" ? siteConfig.currency.locale : "en-US",
    {
      style: "currency",
      currency: siteConfig.currency.code,
      maximumFractionDigits: 0,
    },
  ).format(amount);
}

export function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

/** Ukuran file yang mudah dibaca, mis. 1,2 MB. */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}
