import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { CourseCatalog } from "@/components/course/CourseCatalog";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCourses, getLevels } from "@/lib/content-server";
import { routes } from "@/lib/routes";
import { pageAlternates } from "@/lib/seo";

/** Konten dari CMS: halaman dibangun ulang paling lambat tiap 5 menit (dan langsung saat CMS menyimpan). */
export const revalidate = 300;

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
  const [courses, levels] = await Promise.all([getCourses(), getLevels()]);

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page section">
        <Suspense fallback={null}>
          <CourseCatalog courses={courses} levels={levels} />
        </Suspense>
      </div>
    </>
  );
}
