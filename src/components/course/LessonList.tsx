"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { tr, type Course } from "@/config/courses";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { useProgress } from "@/lib/progress";
import { Icon } from "@/components/ui/Icon";

/**
 * Daftar pelajaran dengan status selesai.
 * `currentId` menandai pelajaran yang sedang dibuka (di halaman pemutar).
 */
export function LessonList({
  course,
  currentId,
  compact,
}: {
  course: Course;
  currentId?: string;
  compact?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { isDone } = useProgress();

  return (
    <ol className="space-y-2">
      {course.lessons.map((lesson, i) => {
        const done = isDone(course.slug, lesson.id);
        const current = lesson.id === currentId;
        return (
          <li key={lesson.id}>
            <Link
              href={routes.lesson(course.slug, lesson.id)}
              aria-current={current ? "page" : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-xl border p-3.5 transition",
                current
                  ? "border-brand bg-brand/10"
                  : "border-line bg-surface hover:border-brand",
              )}
            >
              <span
                className={clsx(
                  "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                  done ? "bg-success text-white" : "bg-surface-2 text-muted",
                )}
              >
                {done ? <Icon name="check" size={18} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {tr(lesson.title, locale)}
                </span>
                {!compact && (
                  <span className="block text-xs text-muted">
                    {t("course.lessonNumber", { number: i + 1 })} ·{" "}
                    {t("common.minutes", { count: lesson.minutes })}
                  </span>
                )}
              </span>
              {done && <span className="sr-only">{t("lesson.completed")}</span>}
              {!done && <Icon name="chevronRight" size={18} className="text-muted" />}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
