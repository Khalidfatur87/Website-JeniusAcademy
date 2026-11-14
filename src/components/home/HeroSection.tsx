import { useTranslations } from "next-intl";
import { Hero3D } from "@/components/three/Hero3D";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { StatsStrip } from "./StatsStrip";

export function HeroSection() {
  const t = useTranslations("hero");
  const { colors, features } = siteConfig;

  return (
    <section className="relative isolate overflow-hidden">
      <div className="aurora" />
      <div className="grid-dots absolute inset-0 -z-10" aria-hidden="true" />

      <div className="container-page grid grid-cols-1 items-center gap-8 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <p className="eyebrow rise">
            <Icon name="sparkles" size={14} />
            {t("badge")}
          </p>
          <h1 className="rise rise-2 mt-5 text-[clamp(2.4rem,6vw,4.1rem)]">
            {t("titleLine1")}
            <br />
            <span className="text-gradient">{t("titleHighlight")}</span>
          </h1>
          <p className="rise rise-3 mt-5 max-w-xl text-lg text-muted">{t("subtitle")}</p>
          <div className="rise rise-4 mt-8 flex flex-wrap gap-3">
            <Link href={routes.register} className="btn btn-primary btn-lg">
              {t("ctaPrimary")}
              <Icon name="arrowRight" size={18} />
            </Link>
            <Link href={routes.pricing} className="btn btn-ghost btn-lg">
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto h-[20rem] w-full max-w-lg sm:h-[26rem] lg:h-[30rem]">
          {features.threeD && (
            <Hero3D primary={colors.primary} accent={colors.accent} label={t("scene")} />
          )}
        </div>
      </div>

      <StatsStrip />
    </section>
  );
}
