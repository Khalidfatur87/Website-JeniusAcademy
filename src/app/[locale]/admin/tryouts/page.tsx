import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/cms/guard";
import { listEditableTryouts, listLevels } from "@/lib/cms/queries";
import { tr } from "@/lib/content";
import { routes } from "@/lib/routes";

export default async function AdminTryoutsPage() {
  const s = await requireStaff();
  if (!s) return null;
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const [tryouts, levels] = await Promise.all([listEditableTryouts(s.sb, s.viewer), listLevels(s.sb)]);
  const levelName = (id: string) => tr(levels.find((l) => l.id === id)?.name, locale) || id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl">{t("tryouts.title")}</h2>
          <p className="mt-1 text-sm text-muted">{t("tryouts.subtitle")}</p>
        </div>
        <Link href={routes.adminNewTryout} className="btn btn-primary">
          + {t("tryouts.new")}
        </Link>
      </div>
      {tryouts.length === 0 ? (
        <p className="card p-8 text-center text-muted">{t("tryouts.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {tryouts.map((x) => (
            <li key={x.slug} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-lg font-semibold">{tr(x.title, locale)}</span>
                  <span
                    className={
                      x.published
                        ? "rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success"
                        : "rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted"
                    }
                  >
                    {x.published ? t("courses.published") : t("courses.draft")}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  {levelName(x.levelId)} · {t("tryouts.sectionCount", { count: x.sectionCount })}
                </p>
              </div>
              <Link href={routes.adminTryout(x.slug)} className="btn btn-primary">
                {t("courses.edit")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
