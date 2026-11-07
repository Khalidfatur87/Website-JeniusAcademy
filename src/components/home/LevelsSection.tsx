import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TiltCard } from "@/components/ui/TiltCard";
import { levels, tr } from "@/config/courses";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";

export function LevelsSection() {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <section className="section bg-surface-2">
      <div className="container-page">
        <SectionHeading title={t("levels.title")} subtitle={t("levels.subtitle")} />

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {levels.map((level) => (
            <li key={level.id}>
              <TiltCard enabled={siteConfig.features.threeD} className="rounded-[var(--radius)]">
                <Link
                  href={routes.coursesByLevel(level.id)}
                  className="card group relative flex h-full flex-col overflow-hidden p-6"
                >
                  <span
                    aria-hidden="true"
                    className="tilt-lift grid size-12 place-items-center rounded-2xl text-lg font-bold text-white"
                    style={{ background: level.color }}
                  >
                    {level.id.toUpperCase().slice(0, 2)}
                  </span>
                  <h3 className="mt-5 text-lg">{tr(level.name, locale)}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted">{tr(level.tagline, locale)}</p>
                  <p className="mt-5 text-sm font-semibold text-brand-ink">
                    {level.price === 0
                      ? t("common.free")
                      : `${t("levels.from")} ${formatPrice(level.price, locale)}`}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold transition group-hover:gap-2.5">
                    {t("levels.explore")}
                    <Icon name="arrowRight" size={16} />
                  </span>
                </Link>
              </TiltCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
