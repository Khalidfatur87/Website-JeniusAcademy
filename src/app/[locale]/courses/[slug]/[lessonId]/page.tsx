import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CourseProgress } from "@/components/course/CourseProgress";
import { Icon } from "@/components/ui/Icon";
import { LessonControls } from "@/components/course/LessonControls";
import { LessonList } from "@/components/course/LessonList";
import { courses, getCourse, tr } from "@/config/courses";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ locale: string; slug: string; lessonId: string }>;
};

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    courses.flatMap((c) =>
      c.lessons.map((l) => ({ locale, slug: c.slug, lessonId: l.id })),
    ),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, lessonId } = await params;
  const lesson = getCourse(slug)?.lessons.find((l) => l.id === lessonId);
  return lesson ? { title: tr(lesson.title, locale) } : {};
}

export default async function LessonPage({ params }: Props) {
  const { locale, slug, lessonId } = await params;
  setRequestLocale(locale);
  const course = getCourse(slug);
  const index = course?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  if (!course || index < 0) notFound();

  const t = await getTranslations();
  const lesson = course.lessons[index];
  const title = tr(lesson.title, locale);

  return (
    <div className="container-page py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={routes.courses} className="hover:text-brand-ink">
              {t("nav.courses")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={routes.course(course.slug)} className="hover:text-brand-ink">
              {tr(course.title, locale)}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-ink">
            {title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-black shadow-glow">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${lesson.youtubeId}`}
              title={t("lesson.videoTitle", { title })}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="size-full"
            />
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-muted">
              {t("course.lessonNumber", { number: index + 1 })} ·{" "}
              {t("common.minutes", { count: lesson.minutes })}
            </p>
            <h1 className="mt-1 text-[clamp(1.6rem,3.5vw,2.2rem)]">{title}</h1>
          </div>

          <div className="mt-6">
            <LessonControls
              slug={course.slug}
              lessonId={lesson.id}
              prevId={course.lessons[index - 1]?.id}
              nextId={course.lessons[index + 1]?.id}
            />
          </div>

          <p className="mt-6 flex items-start gap-2 text-xs text-muted">
            <Icon name="sparkles" size={14} className="mt-0.5 shrink-0" />
            {t("common.placeholderNote")}
          </p>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="text-lg">{t("lesson.inThisCourse")}</h2>
            <div className="my-4">
              <CourseProgress course={course} />
            </div>
            <LessonList course={course} currentId={lesson.id} compact />
          </div>
        </aside>
      </div>
    </div>
  );
}
