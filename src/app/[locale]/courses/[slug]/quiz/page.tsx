import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { PageHeader } from "@/components/ui/PageHeader";
import { courses, getCourse, tr } from "@/config/courses";
import { getQuiz } from "@/config/quizzes";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { routes } from "@/lib/routes";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    courses.filter((c) => getQuiz(c.slug)).map((c) => ({ locale, slug: c.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = getCourse(slug);
  if (!course || !getQuiz(slug)) return {};
  const t = await getTranslations({ locale, namespace: "quiz" });
  return { title: t("title", { course: tr(course.title, locale) }) };
}

export default async function QuizPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const course = getCourse(slug);
  const questions = getQuiz(slug);
  if (!course || !questions) notFound();

  const t = await getTranslations("quiz");

  return (
    <>
      <PageHeader
        title={t("title", { course: tr(course.title, locale) })}
        subtitle={t("subtitle")}
      >
        <Link href={routes.course(course.slug)} className="mt-4 inline-block text-sm font-semibold text-brand-ink hover:underline">
          ← {t("backToCourse")}
        </Link>
      </PageHeader>

      <div className="container-page section max-w-3xl">
        <QuizRunner slug={course.slug} questions={questions} />
      </div>
    </>
  );
}
