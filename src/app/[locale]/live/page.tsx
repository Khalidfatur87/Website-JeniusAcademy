import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/content";
import { getLevels, getLiveSessions } from "@/lib/content-server";
import { formatDateTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { pageAlternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "live" });
  return { title: t("title"), description: t("subtitle"), alternates: pageAlternates(locale, routes.live) };
}

export default async function LivePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("live");
  const loc = await getLocale();
  const [sessions, levels] = await Promise.all([getLiveSessions(), getLevels()]);
  const levelName = (id: string) => tr(levels.find((l) => l.id === id)?.name, loc) || id;
  // Halaman di-cache 1 menit; batas "selesai" cukup kasar untuk pemisahan daftar.
  // eslint-disable-next-line react-hooks/purity -- waktu render server (ISR), bukan state klien
  const now = Date.now();
  const upcoming = sessions.filter((s) => new Date(s.startsAt).getTime() + s.minutes * 60_000 > now);
  const past = sessions.filter((s) => new Date(s.startsAt).getTime() + s.minutes * 60_000 <= now).reverse();

  const card = (s: (typeof sessions)[number], pastItem: boolean) => (
    <li key={s.id} className="card relative flex flex-col gap-2 p-5">
      <p className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-full bg-brand/10 px-2.5 py-1 text-brand-ink">{levelName(s.levelId)}</span>
        {pastItem && <span className="rounded-full bg-surface-2 px-2.5 py-1 text-muted">{t("recordingBadge")}</span>}
      </p>
      <h3 className="text-lg">{tr(s.title, loc)}</h3>
      <p className="flex items-center gap-1.5 text-sm text-muted">
        <Icon name="clock" size={16} />
        {formatDateTime(s.startsAt, loc)} · {t("minutes", { count: s.minutes })}
      </p>
      {s.hostName && <p className="text-sm text-muted">{t("host", { name: s.hostName })}</p>}
      <Link href={routes.liveSession(s.id)} className="mt-2 text-sm font-semibold text-brand-ink hover:underline">
        {pastItem ? t("watchRecording") : t("details")}
        <span className="absolute inset-0" aria-hidden="true" />
      </Link>
    </li>
  );

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page section space-y-10">
        <section aria-labelledby="upcoming" className="space-y-4">
          <h2 id="upcoming" className="text-2xl">
            {t("upcoming")}
          </h2>
          {upcoming.length ? (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{upcoming.map((s) => card(s, false))}</ul>
          ) : (
            <p className="card p-8 text-center text-muted">{t("noUpcoming")}</p>
          )}
        </section>
        {past.length > 0 && (
          <section aria-labelledby="past" className="space-y-4">
            <h2 id="past" className="text-2xl">
              {t("past")}
            </h2>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{past.slice(0, 12).map((s) => card(s, true))}</ul>
          </section>
        )}
      </div>
    </>
  );
}
