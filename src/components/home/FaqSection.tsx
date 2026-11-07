import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";

const faqs = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export function FaqSection() {
  const t = useTranslations("faq");

  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <SectionHeading wide title={t("title")} />
        <div className="mt-10 space-y-3">
          {faqs.map((q) => (
            <details key={q} className="card group px-5 py-4 open:shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                {t(`${q}.q`)}
                <Icon
                  name="chevronDown"
                  className="shrink-0 text-brand-ink transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-muted">{t(`${q}.a`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
