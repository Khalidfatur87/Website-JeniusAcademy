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
    // Mobile: tombol penuh selebar layar, navigasi sebelumnya/berikutnya berdampingan.
    // Layar lebar: satu baris, navigasi di kanan.
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => toggle(slug, lessonId)}
        aria-pressed={done}
        className={`${done ? "btn btn-ghost" : "btn btn-primary"} w-full sm:w-auto`}
      >
        <Icon name="check" size={16} />
        {done ? t("markUndone") : t("markDone")}
      </button>

      <div className="flex gap-2 sm:ml-auto">
        {prevId && (
          <Link href={routes.lesson(slug, prevId)} className="btn btn-ghost flex-1 sm:flex-none">
            <Icon name="chevronLeft" size={16} />
            {t("previous")}
          </Link>
        )}
        {nextId ? (
          <Link
            href={routes.lesson(slug, nextId)}
            onClick={() => markDone(slug, lessonId)}
            className="btn btn-primary flex-1 sm:flex-none"
          >
            {t("next")}
            <Icon name="chevronRight" size={16} />
          </Link>
        ) : (
          <Link href={routes.course(slug)} className="btn btn-ghost flex-1 sm:flex-none">
            {t("backToCourse")}
          </Link>
        )}
      </div>
    </div>
  );
}
