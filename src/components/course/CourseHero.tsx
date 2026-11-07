import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { getLevel, tr, type Course } from "@/config/courses";
import { Link } from "@/i18n/navigation";
import { levelGradient } from "@/lib/course-utils";
import { routes } from "@/lib/routes";
import { CourseMeta } from "@/components/course/CourseMeta";

/** Header halaman detail kelas dengan warna jenjang. */
export function CourseHero({ course }: { course: Course }) {
  const locale = useLocale();
  const t = useTranslations("course");
  const level = getLevel(course.levelId);

  return (
    <header className="text-white" style={{ background: levelGradient(level.color) }}>
      <div className="container-page py-12 sm:py-16">
        <Link
          href={routes.courses}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white/85 hover:text-white"
        >
          <Icon name="chevronLeft" size={16} />
          {t("backToCourses")}
        </Link>
        <p className="mt-6 inline-block rounded-full bg-black/25 px-3 py-1 text-xs font-semibold backdrop-blur">
          {tr(level.name, locale)}
        </p>
        <h1 className="mt-3 text-[clamp(2rem,5vw,3.2rem)]">{tr(course.title, locale)}</h1>
        <p className="mt-3 max-w-2xl text-lg text-white/90">{tr(course.summary, locale)}</p>
        <CourseMeta course={course} size={16} className="mt-6 gap-x-6 gap-y-2 text-sm text-white/90" />
      </div>
    </header>
  );
}
