import { getLocale, getTranslations } from "next-intl/server";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/cms/guard";
import { courseStats, lessonFunnel, siteOverview } from "@/lib/cms/queries";
import { tr } from "@/lib/content";
import { routes } from "@/lib/routes";

type Props = { searchParams: Promise<{ course?: string }> };

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

/** Statistik: ringkasan situs (super admin), per kelas, dan di pelajaran mana siswa berhenti. */
export default async function StatsPage({ searchParams }: Props) {
  const s = await requireStaff();
  if (!s) return null;
  const t = await getTranslations("admin.stats");
  const locale = await getLocale();
  const { course: selected } = await searchParams;

  const [overview, stats] = await Promise.all([siteOverview(s.sb), courseStats(s.sb)]);
  const focus = stats.find((c) => c.slug === selected) ?? stats.find((c) => c.learners > 0) ?? stats[0];
  const funnel = focus ? await lessonFunnel(s.sb, focus.slug) : [];
  const start = funnel[0]?.completed ?? 0;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      {overview && (
        <section aria-labelledby="overview" className="space-y-3">
          <h3 id="overview" className="text-lg">
            {t("overview")}
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Stat label={t("users")} value={overview.users} />
            <Stat label={t("newUsers")} value={overview.newUsers30d} />
            <Stat label={t("activeLearners")} value={overview.activeLearners7d} />
            <Stat label={t("activeSubscriptions")} value={overview.activeSubscriptions} />
            <Stat label={t("certificates")} value={overview.certificates} />
            <Stat label={t("pendingReviews")} value={overview.pendingReviews} />
          </div>
        </section>
      )}

      <section aria-labelledby="per-course" className="space-y-3">
        <h3 id="per-course" className="text-lg">
          {t("perCourse")}
        </h3>
        {stats.length === 0 ? (
          <p className="card p-6 text-center text-muted">{t("empty")}</p>
        ) : (
          <ul className="space-y-3">
            {stats.map((c) => {
              const completion = pct(c.completers, c.learners);
              return (
                <li key={c.slug} className="card space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{tr(c.title, locale)}</p>
                    <Link
                      href={`${routes.adminStats}?course=${c.slug}`}
                      className="text-sm font-semibold text-brand-ink hover:underline"
                      aria-current={focus?.slug === c.slug ? "true" : undefined}
                    >
                      {t("seeFunnel")}
                    </Link>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-xs text-muted">{t("learners")}</dt>
                      <dd className="font-semibold">{c.learners}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">{t("completed")}</dt>
                      <dd className="font-semibold">
                        {c.completers} <span className="font-normal text-muted">({completion}%)</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">{t("avgQuiz")}</dt>
                      <dd className="font-semibold">
                        {c.avgBestPercent === null ? "–" : `${c.avgBestPercent}%`}
                        <span className="font-normal text-muted"> · {t("quizTakers", { count: c.quizTakers })}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">{t("certificates")}</dt>
                      <dd className="font-semibold">{c.certificates}</dd>
                    </div>
                  </dl>
                  <ProgressBar value={completion} label={t("completionLabel", { percent: completion })} color="var(--success)" />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {focus && (
        <section aria-labelledby="funnel" className="space-y-3">
          <h3 id="funnel" className="text-lg">
            {t("funnelTitle", { course: tr(focus.title, locale) })}
          </h3>
          <p className="text-sm text-muted">{t("funnelHint")}</p>
          {funnel.length === 0 || start === 0 ? (
            <p className="card p-6 text-center text-muted">{t("funnelEmpty")}</p>
          ) : (
            <ol className="card space-y-3 p-5">
              {funnel.map((step, i) => {
                const prev = i > 0 ? funnel[i - 1].completed : step.completed;
                const drop = prev > 0 ? pct(prev - step.completed, prev) : 0;
                return (
                  <li key={step.lessonId} className="space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium">
                        {i + 1}. {tr(step.title, locale)}
                      </span>
                      <span className="text-muted">
                        {t("funnelCount", { count: step.completed })}
                        {i > 0 && drop >= 20 && (
                          <span className="ml-2 font-semibold text-danger">{t("dropOff", { percent: drop })}</span>
                        )}
                      </span>
                    </div>
                    <ProgressBar
                      value={pct(step.completed, Math.max(start, ...funnel.map((f) => f.completed)))}
                      label={t("funnelCount", { count: step.completed })}
                    />
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
