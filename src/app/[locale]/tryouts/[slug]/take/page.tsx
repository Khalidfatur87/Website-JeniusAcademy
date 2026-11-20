import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TryoutRunner } from "@/components/tryout/TryoutRunner";
import { tr } from "@/lib/content";
import { getTryout } from "@/lib/content-server";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const x = await getTryout(slug);
  const t = await getTranslations({ locale, namespace: "tryout" });
  return { title: x ? t("takeTitle", { title: tr(x.title, locale) }) : t("title"), robots: { index: false } };
}

export default async function TakeTryoutPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const x = await getTryout(slug);
  if (!x) notFound();
  return <TryoutRunner tryout={x} />;
}
