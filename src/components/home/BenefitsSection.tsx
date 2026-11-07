import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TiltCard } from "@/components/ui/TiltCard";
import { siteConfig } from "@/config/site";

const benefits: { key: "free" | "fresh" | "easy"; icon: IconName }[] = [
  { key: "free", icon: "sparkles" },
  { key: "fresh", icon: "book" },
  { key: "easy", icon: "check" },
];

export function BenefitsSection() {
  const t = useTranslations("benefits");

  return (
    <section className="section">
      <div className="container-page">
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {benefits.map(({ key, icon }) => (
            <li key={key}>
              <TiltCard enabled={siteConfig.features.threeD} className="rounded-[var(--radius)]">
                <div className="card h-full p-7">
                  <span className="tilt-lift grid size-14 place-items-center rounded-2xl bg-brand-strong text-on-brand shadow-glow">
                    <Icon name={icon} size={26} />
                  </span>
                  <h3 className="mt-5 text-xl">{t(`${key}.title`)}</h3>
                  <p className="mt-2 text-muted">{t(`${key}.desc`)}</p>
                </div>
              </TiltCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
