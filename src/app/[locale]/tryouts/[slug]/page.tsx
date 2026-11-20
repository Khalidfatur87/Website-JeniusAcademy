import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { TryoutPanel } from "@/components/tryout/TryoutPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/content";
import { getLevels, getTryout, getTryouts } from "@/lib/content-server";
import { routing } from "@/i18n/routing";
import { routes } from "@/lib/routes";
import { pageAlternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  const tryouts = await getTryouts();
  return routing.locales.flatMap((locale) => tryouts.map((x) => ({ locale, slug: x.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const x = await getTryout(slug);
  if (!x) return {};
  return {
    title: tr(x.title, locale),
    description: tr(x.description, locale),
    alternates: pageAlternates(locale, routes.tryout(slug)),
  };
}

export default async function TryoutPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const x = await getTryout(slug);
  if (!x) notFound();
  const t = await getTranslations("tryout");
  const loc = await getLocale();
  const level = (await getLevels()).find((l) => l.id === x.levelId);

  return (
    <>
      <PageHeader title={tr(x.title, loc)} subtitle={tr(x.description, loc) || undefined}>
        <Link href={routes.tryouts} className="mt-4 inline-block text-sm font-semibold text-brand-ink hover:underline">
          ← {t("back")}
        </Link>
      </PageHeader>
      <div className="container-page section">
        <TryoutPanel tryout={x} level={level ?? null} />
      </div>
    </>
  );
}
