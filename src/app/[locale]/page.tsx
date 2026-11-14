import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { CtaSection } from "@/components/home/CtaSection";
import { FaqSection } from "@/components/home/FaqSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { LevelsSection } from "@/components/home/LevelsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { routes } from "@/lib/routes";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: pageAlternates(locale, routes.home) };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const socials = Object.values(siteConfig.socials).filter(Boolean);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: siteConfig.name,
          url: siteConfig.url,
          ...(siteConfig.logo.src && {
            logo: new URL(siteConfig.logo.src, siteConfig.url).toString(),
          }),
          ...(socials.length && { sameAs: socials }),
        }}
      />
      <HeroSection />
      <BenefitsSection />
      <LevelsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
      <ContactSection />
    </>
  );
}
