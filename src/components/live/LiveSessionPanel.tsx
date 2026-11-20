"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { SubscribeCta } from "@/components/course/SubscribeCta";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { getClient, useAuth } from "@/lib/auth";
import { tr, type Level } from "@/lib/content";
import type { LiveSession } from "@/lib/content-server";
import { formatDateTime } from "@/lib/format";
import { buildIcs, livePhase } from "@/lib/live";
import { routes } from "@/lib/routes";
import { isSupabaseConfigured } from "@/lib/supabase/client";

type Access = { access: false } | { access: true; join_url: string | null; recording_youtube_id: string | null };

/** Waktu, tombol masuk (dibuka 15 menit sebelum mulai), kalender, dan rekaman. */
export function LiveSessionPanel({ session, level }: { session: LiveSession; level: Level | null }) {
  const t = useTranslations("live");
  const locale = useLocale();
  const { ready, user } = useAuth();
  const [access, setAccess] = useState<Access | null>(null);
  const [now, setNow] = useState(() => new Date());
  const phase = livePhase(session.startsAt, session.minutes, now);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ready || !isSupabaseConfigured) return;
    let alive = true;
    getClient()
      .rpc("live_access", { p_id: session.id })
      .then(({ data }) => alive && setAccess((data as Access | null) ?? { access: false }));
    return () => {
      alive = false;
    };
    // Muat ulang saat fase berubah: link masuk baru tersedia 15 menit sebelum mulai.
  }, [ready, user?.id, session.id, phase]);

  const downloadIcs = () => {
    const url = `${window.location.origin}/${locale}${routes.liveSession(session.id)}`;
    const ics = buildIcs({
      id: session.id,
      title: `${siteConfig.name}: ${tr(session.title, locale)}`,
      description: tr(session.description, locale),
      startsAt: session.startsAt,
      minutes: session.minutes,
      url,
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "kelas-live.ics";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const recording = access?.access ? access.recording_youtube_id : null;

  return (
    <div className="space-y-6">
      <div className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-semibold">
            <Icon name="clock" size={18} />
            {formatDateTime(session.startsAt, locale)} · {t("minutes", { count: session.minutes })}
          </p>
          {session.hostName && <p className="text-sm text-muted">{t("host", { name: session.hostName })}</p>}
          <p className="text-sm">
            <span
              className={
                phase === "live"
                  ? "rounded-full bg-danger/15 px-2.5 py-0.5 text-xs font-bold text-danger"
                  : "rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted"
              }
            >
              {t(`phase.${phase}`)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {phase !== "ended" && (
            <button type="button" onClick={downloadIcs} className="btn btn-ghost">
              <Icon name="clock" size={16} />
              {t("addToCalendar")}
            </button>
          )}
          {access?.access && access.join_url && phase !== "ended" && (
            <a href={access.join_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <Icon name="play" size={16} />
              {t("join")}
            </a>
          )}
        </div>
      </div>

      {access?.access && !access.join_url && phase === "upcoming" && (
        <p className="text-sm text-muted">{t("linkLater")}</p>
      )}

      {access && !access.access && (
        <div className="card space-y-3 p-6">
          <p className="flex items-center gap-2 font-medium">
            <Icon name="lock" size={18} />
            {user ? t("locked", { level: level ? tr(level.name, locale) : "" }) : t("loginToJoin")}
          </p>
          {user && level ? (
            <SubscribeCta level={level} />
          ) : (
            <Link href={routes.login} className="btn btn-primary">
              {t("login")}
            </Link>
          )}
        </div>
      )}

      {recording && (
        <section aria-labelledby="rec" className="space-y-3">
          <h2 id="rec" className="text-xl">
            {t("recording")}
          </h2>
          <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${recording}`}
              title={t("recordingOf", { title: tr(session.title, locale) })}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="size-full"
            />
          </div>
        </section>
      )}
      {phase === "ended" && access?.access && !recording && <p className="text-sm text-muted">{t("noRecording")}</p>}
    </div>
  );
}
