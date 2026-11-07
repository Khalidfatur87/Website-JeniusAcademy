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
