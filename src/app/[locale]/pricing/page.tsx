import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { pageAlternates } from "@/lib/seo";
import { PricingCard } from "@/components/pricing/PricingCard";
import { getLevels } from "@/lib/content-server";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: pageAlternates(locale, routes.pricing),
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");
  const levels = await getLevels();

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="container-page section">
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {levels.map((level) => (
            <li key={level.id} className="pt-4">
              <PricingCard level={level} />
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center text-sm text-muted">{t("note")}</p>
      </div>
    </>
  );
}
