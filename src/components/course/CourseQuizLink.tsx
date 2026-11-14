"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { Link } from "@/i18n/navigation";
import { bestAttempt } from "@/lib/quiz";
import { useQuizResults } from "@/lib/quiz-results";
import { routes } from "@/lib/routes";

/** Tombol menuju kuis kelas + skor terbaik bila sudah pernah dikerjakan. */
export function CourseQuizLink({ slug, count }: { slug: string; count: number }) {
  const t = useTranslations("course");
  const { attempts } = useQuizResults();
  const best = bestAttempt(attempts, slug);

  return (
    <div className="space-y-2">
      <Link href={routes.quiz(slug)} className="btn btn-ghost btn-lg w-full">
        <Icon name="sparkles" size={16} />
        {best ? t("quizRetake") : t("quiz")}
      </Link>
      <p className="text-center text-xs text-muted">
        {best
          ? t("quizBest", { score: best.score, total: best.total })
          : t("quizCount", { count })}
      </p>
    </div>
  );
}
