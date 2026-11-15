import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProfileView } from "@/components/profile/ProfileView";
import { PageHeader } from "@/components/ui/PageHeader";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  return { title: t("title"), robots: { index: false } };
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profile");

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ProfileView />
    </>
  );
}
