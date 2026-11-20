import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { LiveSessionPanel } from "@/components/live/LiveSessionPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/content";
import { getLevels, getLiveSessions } from "@/lib/content-server";
import { routes } from "@/lib/routes";

type Props = { params: Promise<{ locale: string; id: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const s = (await getLiveSessions()).find((x) => x.id === id);
  return s ? { title: tr(s.title, locale), description: tr(s.description, locale) } : {};
}

export default async function LiveSessionPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [sessions, levels] = await Promise.all([getLiveSessions(), getLevels()]);
  const session = sessions.find((x) => x.id === id);
  if (!session) notFound();
  const t = await getTranslations("live");
  const loc = await getLocale();
  const level = levels.find((l) => l.id === session.levelId) ?? null;

  return (
    <>
      <PageHeader title={tr(session.title, loc)} subtitle={tr(session.description, loc) || undefined}>
        <Link href={routes.live} className="mt-4 inline-block text-sm font-semibold text-brand-ink hover:underline">
          ← {t("back")}
        </Link>
      </PageHeader>
      <div className="container-page section max-w-4xl">
        <LiveSessionPanel session={session} level={level} />
      </div>
    </>
  );
}
