import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = ["step1", "step2", "step3"] as const;

export function HowItWorksSection() {
  const t = useTranslations("how");

  return (
    <section className="section">
      <div className="container-page">
        <SectionHeading wide title={t("title")} />
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s} className="relative">
              <span className="text-6xl font-bold text-brand/20">0{i + 1}</span>
              <h3 className="-mt-3 text-xl">{t(`${s}.title`)}</h3>
              <p className="mt-2 text-muted">{t(`${s}.desc`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
