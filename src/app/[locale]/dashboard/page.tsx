import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { PageHeader } from "@/components/ui/PageHeader";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title"), robots: { index: false } };
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <DashboardView />
    </>
  );
}
