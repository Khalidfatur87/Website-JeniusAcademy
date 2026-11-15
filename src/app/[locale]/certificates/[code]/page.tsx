import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PrintButton } from "@/components/certificate/PrintButton";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/content";
import { getCertificate } from "@/lib/content-server";
import { formatDate } from "@/lib/format";
import { attemptPercent } from "@/lib/quiz";
import { routes } from "@/lib/routes";

type Props = { params: Promise<{ locale: string; code: string }> };

// Sertifikat tidak berubah setelah terbit; halaman dibuat saat pertama dibuka lalu di-cache.
export const revalidate = 86400;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, code } = await params;
  const cert = await getCertificate(code);
  const t = await getTranslations({ locale, namespace: "certificate" });
  return {
    title: cert ? t("pageTitle", { course: tr(cert.courseTitle, locale) }) : t("notFound"),
    robots: { index: false },
  };
}

export default async function CertificatePage({ params }: Props) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const cert = await getCertificate(code);
  if (!cert) notFound();
  const t = await getTranslations("certificate");
  const course = tr(cert.courseTitle, locale);

  return (
    <div className="container-page section max-w-4xl space-y-6 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="flex items-center gap-2 text-sm font-medium text-success">
          <Icon name="check" size={18} />
          {t("verified")}
        </p>
        <PrintButton />
      </div>

      <article
        className="relative overflow-hidden rounded-3xl border-4 border-double border-brand bg-surface p-8 text-center shadow-glow sm:p-14 print:shadow-none"
        aria-label={t("title")}
      >
        <div className="grid-dots pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="relative space-y-6">
          <div className="flex justify-center">
            <Logo />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-muted">{t("heading")}</p>
          <p className="text-muted">{t("presentedTo")}</p>
          <p className="break-words text-[clamp(1.8rem,5vw,3rem)] font-bold text-brand-ink">{cert.recipientName}</p>
          <p className="text-muted">{t("forCompleting")}</p>
          <p className="break-words text-[clamp(1.3rem,3vw,1.9rem)] font-semibold">{course}</p>
          {cert.score !== null && cert.total !== null && (
            <p className="text-sm text-muted">
              {t("quizScore", {
                score: cert.score,
                total: cert.total,
                percent: attemptPercent({ score: cert.score, total: cert.total }),
              })}
            </p>
          )}
          <div className="mx-auto grid max-w-xl grid-cols-1 gap-4 border-t border-line pt-6 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted">{t("issuedOn")}</p>
              <p className="font-semibold">{formatDate(cert.issuedAt, locale)}</p>
            </div>
            <div>
              <p className="text-muted">{t("code")}</p>
              <p className="font-mono font-semibold tracking-wider">{cert.code}</p>
            </div>
          </div>
          <p className="text-xs text-muted">
            {t("verifyAt", { url: `${siteConfig.url.replace(/\/$/, "")}/${locale}${routes.certificate(cert.code)}` })}
          </p>
        </div>
      </article>

      <p className="text-center text-sm print:hidden">
        <Link href={routes.course(cert.courseSlug)} className="font-semibold text-brand-ink hover:underline">
          {t("toCourse")}
        </Link>
      </p>
    </div>
  );
}
