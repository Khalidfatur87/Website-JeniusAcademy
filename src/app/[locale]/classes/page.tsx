import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClassesView } from "@/components/classes/ClassesView";
import { PageHeader } from "@/components/ui/PageHeader";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "classes" });
  return { title: t("title"), robots: { index: false } };
}

export default async function ClassesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("classes");
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page section">
        <ClassesView />
      </div>
    </>
  );
}
