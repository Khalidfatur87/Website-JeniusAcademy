import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/cms/guard";
import { getEditableCourse, studentReport } from "@/lib/cms/queries";
import { tr } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { attemptPercent } from "@/lib/quiz";
import { routes } from "@/lib/routes";

type Props = { params: Promise<{ locale: string; slug: string }> };

/** Progres dan nilai kuis siswa di satu kelas (guru pemilik / super admin). */
export default async function StudentsPage({ params }: Props) {
  const { slug } = await params;
  const s = await requireStaff();
  if (!s) return null;
  const t = await getTranslations("admin");
  const locale = await getLocale();

  const course = await getEditableCourse(s.sb, s.viewer, slug);
  if (!course) notFound();
  const rows = await studentReport(s.sb, slug);
  const total = course.lessons.length;

  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.adminCourse(slug)} className="text-sm font-semibold text-brand-ink hover:underline">
          ← {tr(course.title, locale)}
        </Link>
        <h2 className="mt-2 text-2xl">{t("students.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("students.subtitle")}</p>
      </div>

      {rows.length === 0 ? (
        <p className="card p-8 text-center text-muted">{t("students.empty")}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="p-4">
                  {t("students.name")}
                </th>
                <th scope="col" className="p-4">
                  {t("students.progress")}
                </th>
                <th scope="col" className="p-4">
                  {t("students.bestScore")}
                </th>
                <th scope="col" className="p-4">
                  {t("students.attempts")}
                </th>
                <th scope="col" className="p-4">
                  {t("students.lastActivity")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.userId}>
                  <td className="p-4 font-medium">{r.name || "—"}</td>
                  <td className="p-4">
                    {r.lessonsDone}/{total}
                    {total > 0 && (
                      <span className="text-muted"> ({Math.round((r.lessonsDone / total) * 100)}%)</span>
                    )}
                  </td>
                  <td className="p-4">
                    {r.bestScore !== null && r.bestTotal
                      ? `${r.bestScore}/${r.bestTotal} (${attemptPercent({ score: r.bestScore, total: r.bestTotal })}%)`
                      : "—"}
                  </td>
                  <td className="p-4">{r.attempts}</td>
                  <td className="p-4 text-muted">
                    {r.lastActivity ? formatDate(r.lastActivity, locale) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
