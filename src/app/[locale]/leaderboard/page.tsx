import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LeaderboardView } from "@/components/gamification/LeaderboardView";
import { PageHeader } from "@/components/ui/PageHeader";
import { getLevels } from "@/lib/content-server";

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "leaderboard" });
  return { title: t("title"), robots: { index: false } };
}

export default async function LeaderboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("leaderboard");
  const levels = await getLevels();
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page section">
        <LeaderboardView levels={levels} />
      </div>
    </>
  );
}
