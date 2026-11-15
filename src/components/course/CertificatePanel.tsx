"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import type { Course } from "@/lib/content";
import { lessonIds } from "@/lib/course-utils";
import { useProgress } from "@/lib/progress";
import { bestAttempt, certificateStatus } from "@/lib/quiz";
import { useQuizResults } from "@/lib/quiz-results";
import { routes } from "@/lib/routes";
import { claimCertificate, useCertificates, type ClaimError } from "@/lib/user-data";

/** Status & tombol sertifikat kelas (syarat diperiksa ulang di database saat diklaim). */
export function CertificatePanel({ course }: { course: Course }) {
  const t = useTranslations("certificate");
  const router = useRouter();
  const { user } = useAuth();
  const { doneIds } = useProgress();
  const { attempts } = useQuizResults();
  const certs = useCertificates();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ClaimError | null>(null);

  const ids = lessonIds(course);
  const done = doneIds(course.slug).filter((id) => ids.includes(id)).length;
  const min = siteConfig.certificate.minQuizPercent;
  const status = certificateStatus({
    doneLessons: done,
    totalLessons: ids.length,
    quizCount: course.quizCount,
    best: bestAttempt(attempts, course.slug),
    minPercent: min,
  });
  const existing = certs.value.find((c) => c.courseSlug === course.slug);

  const claim = async () => {
    setBusy(true);
    setError(null);
    const r = await claimCertificate(course.slug);
    setBusy(false);
    if ("error" in r) return setError(r.error);
    certs.reload();
    router.push(routes.certificate(r.code));
  };

  return (
    <div className="space-y-3 border-t border-line pt-5">
      <h3 className="flex items-center gap-2 text-base">
        <Icon name="award" size={18} className="text-accent" />
        {t("title")}
      </h3>

      {existing ? (
        <Link href={routes.certificate(existing.code)} className="btn btn-ghost w-full">
          {t("view")}
        </Link>
      ) : !user ? (
        <p className="text-sm text-muted">{t("loginRequired")}</p>
      ) : status === "ready" ? (
        <button type="button" onClick={() => void claim()} disabled={busy} className="btn btn-primary w-full">
          {t("claim")}
        </button>
      ) : (
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-start gap-2">
            <Icon
              name={status === "lessons" ? "clock" : "check"}
              size={16}
              className={`mt-0.5 shrink-0 ${status === "lessons" ? "text-muted" : "text-success"}`}
            />
            {t("reqLessons", { done, total: ids.length })}
          </li>
          {course.quizCount > 0 && (
            <li className="flex items-start gap-2">
              <Icon name="clock" size={16} className="mt-0.5 shrink-0 text-muted" />
              {t("reqQuiz", { percent: min })}
            </li>
          )}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {t(`errors.${error}`, { percent: min })}
        </p>
      )}
    </div>
  );
}
