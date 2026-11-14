import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CourseForm } from "@/components/admin/CourseForm";
import { DeleteCourseButton } from "@/components/admin/DeleteCourseButton";
import { LessonsEditor } from "@/components/admin/LessonsEditor";
import { QuizEditor } from "@/components/admin/QuizEditor";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/cms/guard";
import { getEditableCourse, listLevels, teacherOptions } from "@/lib/cms/queries";
import { tr } from "@/lib/content";
import { routes } from "@/lib/routes";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function EditCoursePage({ params }: Props) {
  const { slug } = await params;
  const s = await requireStaff();
  if (!s) return null;
  const t = await getTranslations("admin");
  const locale = await getLocale();

  const [course, levels, teachers] = await Promise.all([
    getEditableCourse(s.sb, s.viewer, slug),
    listLevels(s.sb),
    teacherOptions(s.sb, s.viewer),
  ]);
  if (!course) notFound();

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={routes.adminCourses} className="text-sm font-semibold text-brand-ink hover:underline">
            ← {t("courses.back")}
          </Link>
          <h2 className="mt-2 text-2xl">{tr(course.title, locale)}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={routes.adminStudents(course.slug)} className="btn btn-ghost">
            {t("courses.students")}
          </Link>
          {course.published && (
            <Link href={routes.course(course.slug)} className="btn btn-ghost" target="_blank">
              {t("courses.view")}
            </Link>
          )}
        </div>
      </div>

      <section aria-labelledby="sec-details" className="space-y-4">
        <h3 id="sec-details" className="text-xl">
          {t("course.details")}
        </h3>
        <CourseForm course={course} levels={levels} teachers={teachers} />
      </section>

      <section aria-labelledby="sec-lessons" className="space-y-4">
        <h3 id="sec-lessons" className="text-xl">
          {t("lessons.heading")} ({course.lessons.length})
        </h3>
        {course.lessons.length === 0 && course.published && (
          <p className="text-sm text-danger">{t("lessons.hiddenWhenEmpty")}</p>
        )}
        {/* key: muat ulang editor setelah tersimpan (id pelajaran baru dari server). */}
        <LessonsEditor
          key={course.lessons.map((l) => l.id).join(",")}
          slug={course.slug}
          lessons={course.lessons}
        />
      </section>

      <section aria-labelledby="sec-quiz" className="space-y-4">
        <h3 id="sec-quiz" className="text-xl">
          {t("quiz.heading")} ({course.questions.length})
        </h3>
        <QuizEditor
          key={course.questions.map((q) => q.id).join(",")}
          slug={course.slug}
          questions={course.questions}
        />
      </section>

      <section aria-labelledby="sec-danger" className="space-y-3 border-t border-line pt-8">
        <h3 id="sec-danger" className="text-xl">
          {t("course.dangerZone")}
        </h3>
        <p className="text-sm text-muted">{t("course.deleteHint")}</p>
        <DeleteCourseButton slug={course.slug} />
      </section>
    </div>
  );
}
