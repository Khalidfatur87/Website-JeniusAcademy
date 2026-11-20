import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/content";
import { getLevels, getTryouts } from "@/lib/content-server";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { pageAlternates } from "@/lib/seo";
import { totalMinutes, tryoutWindow } from "@/lib/tryout";

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tryout" });
  return { title: t("title"), description: t("subtitle"), alternates: pageAlternates(locale, routes.tryouts) };
}

export default async function TryoutsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tryout");
  const loc = await getLocale();
  const [tryouts, levels] = await Promise.all([getTryouts(), getLevels()]);
  const levelName = (id: string) => tr(levels.find((l) => l.id === id)?.name, loc) || id;

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page section">
        {tryouts.length === 0 ? (
          <p className="card p-8 text-center text-muted">{t("empty")}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tryouts.map((x) => {
              const w = tryoutWindow(x);
              return (
                <li key={x.slug} className="card relative flex flex-col gap-3 p-6">
                  <p className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-brand/10 px-2.5 py-1 text-brand-ink">{levelName(x.levelId)}</span>
                    <span
                      className={
                        w === "open"
                          ? "rounded-full bg-success/15 px-2.5 py-1 text-success"
                          : "rounded-full bg-surface-2 px-2.5 py-1 text-muted"
                      }
                    >
                      {t(`window.${w}`)}
                    </span>
                  </p>
                  <h2 className="text-xl">{tr(x.title, loc)}</h2>
                  {tr(x.description, loc) && <p className="line-clamp-3 text-sm text-muted">{tr(x.description, loc)}</p>}
                  <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="book" size={16} />
                      {t("sectionCount", { count: x.sections.length })}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="clock" size={16} />
                      {t("minutes", { count: totalMinutes(x.sections) })}
                    </span>
                  </p>
                  {(x.opensAt || x.closesAt) && (
                    <p className="text-xs text-muted">
                      {x.opensAt && t("opensAt", { date: formatDate(x.opensAt, loc) })}
                      {x.opensAt && x.closesAt && " · "}
                      {x.closesAt && t("closesAt", { date: formatDate(x.closesAt, loc) })}
                    </p>
                  )}
                  <Link href={routes.tryout(x.slug)} className="btn btn-primary mt-auto">
                    {t("view")}
                    <span className="absolute inset-0" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
