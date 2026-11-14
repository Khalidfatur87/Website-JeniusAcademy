import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { pageAlternates } from "@/lib/seo";
import { ReviewsBoard } from "@/components/review/ReviewsBoard";
import { siteConfig } from "@/config/site";
import { getLevels } from "@/lib/content-server";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reviews" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: pageAlternates(locale, routes.reviews),
  };
}

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("reviews");
  const levels = await getLevels();

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page section">
        <ReviewsBoard formEnabled={siteConfig.features.reviewForm} levels={levels} />
      </div>
    </>
  );
}
