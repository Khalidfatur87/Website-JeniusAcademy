import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { TiltCard } from "@/components/ui/TiltCard";
import { getLevel, tr, type Course } from "@/config/courses";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { levelGradient } from "@/lib/course-utils";
import { routes } from "@/lib/routes";
import { CourseMeta } from "@/components/course/CourseMeta";
import { CourseProgress } from "@/components/course/CourseProgress";

export function CourseCard({ course }: { course: Course }) {
  const locale = useLocale();
  const t = useTranslations("courses");
  const level = getLevel(course.levelId);

  return (
    <TiltCard enabled={siteConfig.features.threeD} className="rounded-[var(--radius)]">
      <article className="card relative flex h-full flex-col overflow-hidden">
        <div
          className="relative flex h-28 items-end p-5"
          style={{ background: levelGradient(level.color) }}
        >
          <span className="tilt-lift rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {tr(level.name, locale)}
          </span>
          <Icon name="book" size={56} className="absolute right-4 top-3 text-white/25" />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-lg">{tr(course.title, locale)}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted">
            {tr(course.summary, locale)}
          </p>

          <CourseMeta course={course} className="mt-4 text-xs text-muted" />

          <div className="mt-5">
            <CourseProgress course={course} />
          </div>

          <Link href={routes.course(course.slug)} className="btn btn-ghost mt-5 w-full">
            {t("view")}
            <Icon name="arrowRight" size={16} />
            {/* Seluruh kartu menjadi area klik */}
            <span className="absolute inset-0" aria-hidden="true" />
          </Link>
        </div>
      </article>
    </TiltCard>
  );
}
