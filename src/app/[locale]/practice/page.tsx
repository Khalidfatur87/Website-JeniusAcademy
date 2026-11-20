import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PracticeView } from "@/components/practice/PracticeView";
import { PageHeader } from "@/components/ui/PageHeader";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "practice" });
  return { title: t("title"), robots: { index: false } };
}

export default async function PracticePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("practice");
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page section">
        <PracticeView />
      </div>
    </>
  );
}
