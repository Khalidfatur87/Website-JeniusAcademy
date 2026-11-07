import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { themeInitScript } from "@/lib/theme-script";
import "../globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: t("title"), template: `%s · ${siteConfig.name}` },
    description: t("description"),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}`]),
      ),
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: siteConfig.name,
      locale,
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f9ff" },
    { media: "(prefers-color-scheme: dark)", color: "#07101f" },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "common" });

  // Warna brand dari src/config/site.ts → CSS variable.
  const brandCss = `html:root{--brand:${siteConfig.colors.primary};--accent:${siteConfig.colors.accent}}`;

  return (
    <html lang={locale} className={poppins.variable} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandCss }} />
        {siteConfig.features.darkMode && (
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        )}
      </head>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-lg bg-brand-strong px-4 py-2 font-semibold text-on-brand"
          >
            {t("skipToContent")}
          </a>
          <Navbar darkModeEnabled={siteConfig.features.darkMode} />
          <main id="main" className="min-h-[70dvh]">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
