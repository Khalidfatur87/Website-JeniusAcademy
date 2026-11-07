import { useTranslations } from "next-intl";
import { siteConfig } from "@/config/site";

/** Angka statistik (PLACEHOLDER di siteConfig.stats). */
export function StatsStrip() {
  const t = useTranslations("stats");

  return (
    <div className="container-page pb-10">
      <dl className="card grid grid-cols-2 gap-y-6 p-6 md:grid-cols-4">
        {siteConfig.stats.map((s) => (
          <div key={s.key} className="text-center">
            <dd className="text-3xl font-bold text-brand-ink">{s.value}</dd>
            <dt className="mt-1 text-sm text-muted">{t(s.key)}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
