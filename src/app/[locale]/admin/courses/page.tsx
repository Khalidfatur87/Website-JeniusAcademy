import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/cms/guard";
import { listEditableCourses, listLevels } from "@/lib/cms/queries";
import { tr } from "@/lib/content";
import { routes } from "@/lib/routes";

export default async function AdminCoursesPage() {
  const s = await requireStaff();
  if (!s) return null;
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const [courses, levels] = await Promise.all([
    listEditableCourses(s.sb, s.viewer),
    listLevels(s.sb),
  ]);
  const levelName = (id: string) => tr(levels.find((l) => l.id === id)?.name, locale) || id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl">
          {s.viewer.role === "super_admin" ? t("courses.allTitle") : t("courses.mineTitle")}
        </h2>
        <Link href={routes.adminNewCourse} className="btn btn-primary">
          + {t("courses.new")}
        </Link>
      </div>

      {courses.length === 0 ? (
        <p className="card p-8 text-center text-muted">{t("courses.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {courses.map((c) => (
            <li key={c.slug} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-lg font-semibold">{tr(c.title, locale)}</span>
                  <span
                    className={
                      c.published
                        ? "rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success"
                        : "rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted"
                    }
                  >
                    {c.published ? t("courses.published") : t("courses.draft")}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  {levelName(c.levelId)} · {t("courses.lessonCount", { count: c.lessonCount })} ·{" "}
                  {t("courses.questionCount", { count: c.questionCount })}
                  {c.teacherName && ` · ${c.teacherName}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={routes.adminStudents(c.slug)} className="btn btn-ghost">
                  {t("courses.students")}
                </Link>
                <Link href={routes.adminCourse(c.slug)} className="btn btn-primary">
                  {t("courses.edit")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
