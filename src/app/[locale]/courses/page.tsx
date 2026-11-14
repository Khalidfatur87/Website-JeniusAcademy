import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { CourseCatalog } from "@/components/course/CourseCatalog";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "courses" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: pageAlternates(locale, routes.courses),
  };
}

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("courses");

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page section">
        <Suspense fallback={null}>
          <CourseCatalog />
        </Suspense>
      </div>
    </>
  );
}
