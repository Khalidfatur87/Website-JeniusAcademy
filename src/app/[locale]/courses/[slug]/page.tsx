import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CourseAction } from "@/components/course/CourseAction";
import { CourseHero } from "@/components/course/CourseHero";
import { CourseProgress } from "@/components/course/CourseProgress";
import { LessonList } from "@/components/course/LessonList";
import { courses, getCourse, tr } from "@/config/courses";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    courses.map((c) => ({ locale, slug: c.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = getCourse(slug);
  if (!course) return {};
  return { title: tr(course.title, locale), description: tr(course.summary, locale) };
}

export default async function CoursePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const course = getCourse(slug);
  if (!course) notFound();

  const t = await getTranslations();

  return (
    <>
      <CourseHero course={course} />

      <div className="container-page section grid gap-10 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="lessons-heading">
          <h2 id="lessons-heading" className="mb-5 text-2xl">
            {t("course.lessonList")}
          </h2>
          <LessonList course={course} />
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-5 p-6">
            <h2 className="text-lg">{t("course.progress")}</h2>
            <CourseProgress course={course} />
            <CourseAction course={course} />
            <p className="text-xs text-muted">{t("common.placeholderNote")}</p>
          </div>
        </aside>
      </div>
    </>
  );
}
