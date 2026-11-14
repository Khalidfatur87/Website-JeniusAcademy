import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CourseAction } from "@/components/course/CourseAction";
import { CourseQuizLink } from "@/components/course/CourseQuizLink";
import { CourseHero } from "@/components/course/CourseHero";
import { CourseProgress } from "@/components/course/CourseProgress";
import { LessonList } from "@/components/course/LessonList";
import { JsonLd } from "@/components/seo/JsonLd";
import { tr } from "@/lib/content";
import { getCourse, getCourses } from "@/lib/content-server";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { routes } from "@/lib/routes";
import { absoluteUrl, pageAlternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  const courses = await getCourses();
  return routing.locales.flatMap((locale) =>
    courses.map((c) => ({ locale, slug: c.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = await getCourse(slug);
  if (!course) return {};
  return {
    title: tr(course.title, locale),
    description: tr(course.summary, locale),
    alternates: pageAlternates(locale, routes.course(slug)),
  };
}

export default async function CoursePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const course = await getCourse(slug);
  if (!course) notFound();

  const t = await getTranslations();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: tr(course.title, locale),
          description: tr(course.summary, locale),
          url: absoluteUrl(locale, routes.course(course.slug)),
          inLanguage: locale,
          provider: {
            "@type": "Organization",
            name: siteConfig.name,
            url: siteConfig.url,
          },
        }}
      />
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
            {course.quizCount > 0 && (
              <CourseQuizLink slug={course.slug} count={course.quizCount} />
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
