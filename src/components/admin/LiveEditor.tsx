"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { deleteLive, liveToLesson, saveLive } from "@/lib/cms/actions";
import type { AdminLive } from "@/lib/cms/queries";
import { tr, type L10n, type Level } from "@/lib/content";
import { formatDateTime, fromLocalInput, toLocalInput } from "@/lib/format";
import { emptyL10n, Field, L10nInput, SaveStatus, type Status } from "./fields";

type CourseOption = { slug: string; title: L10n; levelId: string };

function LiveForm({
  session,
  levels,
  courses,
  onDone,
}: {
  session?: AdminLive;
  levels: Level[];
  courses: CourseOption[];
  onDone?: () => void;
}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const id = useId();
  const [levelId, setLevelId] = useState(session?.levelId ?? levels[0]?.id ?? "");
  const [courseSlug, setCourseSlug] = useState(session?.courseSlug ?? "");
  const [title, setTitle] = useState(session?.title ?? emptyL10n());
  const [description, setDescription] = useState(session?.description ?? emptyL10n());
  const [startsAt, setStartsAt] = useState(toLocalInput(session?.startsAt));
  const [minutes, setMinutes] = useState(session?.minutes ?? 60);
  const [hostName, setHostName] = useState(session?.hostName ?? "");
  const [joinUrl, setJoinUrl] = useState(session?.joinUrl ?? "");
  const [recording, setRecording] = useState(session?.recordingYoutubeId ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    start(async () => {
      const result = await saveLive(
        {
          levelId,
          courseSlug: courseSlug || null,
          title,
          description,
          startsAt: fromLocalInput(startsAt) ?? "",
          minutes,
          hostName,
          joinUrl,
          recording,
        },
        session?.id ?? null,
      );
      setStatus(result);
      if (result.ok) {
        router.refresh();
        onDone?.();
      }
    });
  };

  const act = (fn: () => Promise<Awaited<ReturnType<typeof deleteLive>>>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setStatus("saving");
    start(async () => {
      const result = await fn();
      setStatus(result);
      if (result.ok) router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <L10nInput label={t("course.title")} value={title} onChange={setTitle} required />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={t("course.level")} htmlFor={`${id}-lv`} hint={t("live.levelHint")}>
          <select id={`${id}-lv`} className="field" value={levelId} onChange={(e) => setLevelId(e.target.value)}>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {tr(l.name, locale)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("live.course")} htmlFor={`${id}-c`} hint={t("live.courseHint")}>
          <select id={`${id}-c`} className="field" value={courseSlug} onChange={(e) => setCourseSlug(e.target.value)}>
            <option value="">{t("live.noCourse")}</option>
            {courses
              .filter((c) => c.levelId === levelId)
              .map((c) => (
                <option key={c.slug} value={c.slug}>
                  {tr(c.title, locale)}
                </option>
              ))}
          </select>
        </Field>
        <Field label={t("live.startsAt")} htmlFor={`${id}-s`}>
          <input id={`${id}-s`} type="datetime-local" className="field" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        </Field>
        <Field label={t("live.minutes")} htmlFor={`${id}-m`}>
          <input id={`${id}-m`} type="number" min={10} max={480} className="field" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
        </Field>
        <Field label={t("live.host")} htmlFor={`${id}-h`}>
          <input id={`${id}-h`} className="field" maxLength={80} value={hostName} onChange={(e) => setHostName(e.target.value)} />
        </Field>
        <Field label={t("live.joinUrl")} htmlFor={`${id}-u`} hint={t("live.joinUrlHint")}>
          <input id={`${id}-u`} type="url" className="field" placeholder="https://meet.google.com/…" value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} />
        </Field>
      </div>
      <L10nInput label={t("tryouts.description")} value={description} onChange={setDescription} multiline />
      <Field label={t("live.recording")} htmlFor={`${id}-r`} hint={t("live.recordingHint")}>
        <input id={`${id}-r`} className="field" placeholder="https://www.youtube.com/watch?v=…" value={recording} onChange={(e) => setRecording(e.target.value)} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {session ? t("save") : t("live.create")}
        </button>
        {session?.recordingYoutubeId && session.courseSlug && (
          <button
            type="button"
            disabled={pending}
            onClick={() => act(() => liveToLesson(session.id), t("live.confirmToLesson"))}
            className="btn btn-ghost"
          >
            {t("live.toLesson")}
          </button>
        )}
        {session && (
          <button
            type="button"
            disabled={pending}
            onClick={() => act(() => deleteLive(session.id), t("live.confirmDelete"))}
            className="btn btn-ghost border-danger text-danger"
          >
            {t("delete")}
          </button>
        )}
        {onDone && (
          <button type="button" onClick={onDone} className="btn btn-ghost">
            {t("cancel")}
          </button>
        )}
        <SaveStatus status={status} />
      </div>
    </form>
  );
}

/** Jadwal kelas live: buat, ubah, hapus, dan jadikan rekaman sebagai pelajaran. */
export function LiveEditor({ sessions, levels, courses }: { sessions: AdminLive[]; levels: Level[]; courses: CourseOption[] }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {adding ? (
        <LiveForm levels={levels} courses={courses} onDone={() => setAdding(false)} />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="btn btn-primary">
          + {t("live.new")}
        </button>
      )}
      {sessions.length === 0 ? (
        <p className="card p-8 text-center text-muted">{t("live.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) =>
            editing === s.id ? (
              <li key={s.id}>
                <LiveForm session={s} levels={levels} courses={courses} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li key={s.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{tr(s.title, locale)}</p>
                  <p className="text-sm text-muted">
                    {formatDateTime(s.startsAt, locale)} · {s.minutes} min
                    {s.recordingYoutubeId && ` · ${t("live.hasRecording")}`}
                  </p>
                </div>
                <button type="button" onClick={() => setEditing(s.id)} className="btn btn-ghost">
                  {t("courses.edit")}
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
