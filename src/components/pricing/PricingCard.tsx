import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { TiltCard } from "@/components/ui/TiltCard";
import { tr, type Level } from "@/config/courses";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";

const FEATURES = ["feature1", "feature2", "feature3", "feature4"] as const;

const sectionLabel = "text-xs font-semibold uppercase tracking-wider text-muted";

export function PricingCard({ level }: { level: Level }) {
  const locale = useLocale();
  const t = useTranslations("pricing");
  const common = useTranslations("common");
  const free = level.price === 0;

  return (
    <TiltCard enabled={siteConfig.features.threeD} className="rounded-[var(--radius)]">
      <article
        className={`card relative flex h-full flex-col p-6 ${
          level.featured ? "ring-2 ring-brand shadow-glow" : ""
        }`}
      >
        {level.featured && (
          <span className="tilt-lift absolute -top-3.5 left-6 rounded-full bg-accent px-3 py-1 text-xs font-bold text-[#3b2600]">
            {t("popular")}
          </span>
        )}

        <h2 className="text-xl">{tr(level.name, locale)}</h2>
        <p className="mt-1 text-sm text-muted">{tr(level.tagline, locale)}</p>

        <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
          <span className="text-3xl font-bold">
            {free ? common("free") : formatPrice(level.price, locale)}
          </span>
          {!free && <span className="text-sm text-muted">{common("perMonth")}</span>}
          {level.originalPrice && (
            <span className="text-sm text-muted line-through">
              {formatPrice(level.originalPrice, locale)}
            </span>
          )}
        </p>

        <h3 className={`mt-6 ${sectionLabel}`}>{t("subjects")}</h3>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {level.subjects.map((s) => (
            <li key={s.id} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium">
              {tr(s, locale)}
            </li>
          ))}
        </ul>

        <h3 className={`mt-6 ${sectionLabel}`}>{t("includes")}</h3>
        <ul className="mt-2 flex-1 space-y-2 text-sm">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-success" />
              {t(f)}
            </li>
          ))}
        </ul>

        <Link
          href={free ? routes.coursesByLevel(level.id) : routes.register}
          className={`btn mt-7 w-full ${level.featured ? "btn-primary" : "btn-ghost"}`}
        >
          {free ? t("startFree") : t("choose")}
        </Link>
      </article>
    </TiltCard>
  );
}
