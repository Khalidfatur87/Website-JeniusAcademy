"use client";

import { useTranslations } from "next-intl";
import type { Course } from "@/lib/content";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { useProgress } from "@/lib/progress";
import { Icon } from "@/components/ui/Icon";

/** Tombol "Mulai / Lanjutkan / Ulangi" sesuai progres tersimpan. */
export function CourseAction({ course }: { course: Course }) {
  const t = useTranslations("course");
  const { doneIds } = useProgress();
  const done = doneIds(course.slug);
  const next = course.lessons.find((l) => !done.includes(l.id));
  const finished = !next;
  const target = next ?? course.lessons[0];

  const label = finished ? t("review") : done.length ? t("resume") : t("start");

  return (
    <Link
      href={routes.lesson(course.slug, target.id)}
      className="btn btn-primary btn-lg w-full"
    >
      <Icon name="play" size={16} />
      {label}
    </Link>
  );
}
