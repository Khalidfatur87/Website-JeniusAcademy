import clsx from "clsx";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import type { Course } from "@/config/courses";
import { courseMinutes } from "@/lib/course-utils";

/** Baris ringkas: jumlah pelajaran, durasi, pengajar. */
export function CourseMeta({
  course,
  className,
  size = 14,
}: {
  course: Course;
  className?: string;
  size?: number;
}) {
  const t = useTranslations();
  const items = [
    { icon: "play", text: t("common.lessons", { count: course.lessons.length }) },
    { icon: "clock", text: t("common.minutes", { count: courseMinutes(course) }) },
    { icon: "user", text: course.teacher },
  ] as const;

  return (
    <ul className={clsx("flex flex-wrap gap-x-4 gap-y-1", className)}>
      {items.map(({ icon, text }) => (
        <li key={icon} className="inline-flex items-center gap-1.5">
          <Icon name={icon} size={size} />
          {text}
        </li>
      ))}
    </ul>
  );
}
