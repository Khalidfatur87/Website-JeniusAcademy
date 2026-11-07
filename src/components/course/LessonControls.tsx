"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { useProgress } from "@/lib/progress";
import { Icon } from "@/components/ui/Icon";

/** Tombol tandai selesai + navigasi pelajaran sebelumnya/berikutnya. */
export function LessonControls({
  slug,
  lessonId,
  prevId,
  nextId,
}: {
  slug: string;
  lessonId: string;
  prevId?: string;
  nextId?: string;
}) {
  const t = useTranslations("lesson");
  const { isDone, toggle, markDone } = useProgress();
  const done = isDone(slug, lessonId);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => toggle(slug, lessonId)}
        aria-pressed={done}
        className={done ? "btn btn-ghost" : "btn btn-primary"}
      >
        <Icon name="check" size={16} />
        {done ? t("markUndone") : t("markDone")}
      </button>

      <div className="ml-auto flex gap-2">
        {prevId && (
          <Link href={routes.lesson(slug, prevId)} className="btn btn-ghost">
            <Icon name="chevronLeft" size={16} />
            {t("previous")}
          </Link>
        )}
        {nextId ? (
          <Link
            href={routes.lesson(slug, nextId)}
            onClick={() => markDone(slug, lessonId)}
            className="btn btn-primary"
          >
            {t("next")}
            <Icon name="chevronRight" size={16} />
          </Link>
        ) : (
          <Link href={routes.course(slug)} className="btn btn-ghost">
            {t("backToCourse")}
          </Link>
        )}
      </div>
    </div>
  );
}
