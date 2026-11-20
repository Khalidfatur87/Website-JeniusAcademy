"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { LoginPrompt } from "@/components/ui/LoginPrompt";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import {
  getMyAssignments,
  getMyClassrooms,
  joinClassroom,
  leaveClassroom,
  type JoinError,
  type MyAssignment,
  type MyClassroom,
} from "@/lib/classes-client";
import { tr } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";

const target = (a: MyAssignment) =>
  a.kind === "lesson" && a.lessonId
    ? routes.lesson(a.courseSlug, a.lessonId)
    : a.kind === "quiz"
      ? routes.quiz(a.courseSlug)
      : routes.course(a.courseSlug);

/** Kelas sekolah siswa: gabung dengan kode dari guru, lalu kerjakan tugasnya. */
export function ClassesView() {
  const t = useTranslations("classes");
  const locale = useLocale();
  const { user, ready } = useAuth();
  const [classes, setClasses] = useState<MyClassroom[] | null>(null);
  const [tasks, setTasks] = useState<MyAssignment[]>([]);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: string } | { error: JoinError } | null>(null);

  const load = useCallback(async (uid: string) => {
    const [c, a] = await Promise.all([getMyClassrooms(uid), getMyAssignments()]);
    setClasses(c);
    setTasks(a);
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    Promise.all([getMyClassrooms(user.id), getMyAssignments()]).then(([c, a]) => {
      if (!alive) return;
      setClasses(c);
      setTasks(a);
    });
    return () => {
      alive = false;
    };
  }, [user]);

  if (!ready) return null;
  if (!user) return <LoginPrompt message={t("loginRequired")} />;

  const join = async (e: FormEvent) => {
    e.preventDefault();
    const r = await joinClassroom(code);
    setMsg("error" in r ? { error: r.error } : { ok: r.name });
    if (!("error" in r)) {
      setCode("");
      void load(user.id);
    }
  };

  const leave = async (c: MyClassroom) => {
    if (!window.confirm(t("confirmLeave", { name: c.name }))) return;
    if (await leaveClassroom(c.id, user.id)) void load(user.id);
  };

  const pending = tasks.filter((a) => !a.status.done);
  const done = tasks.filter((a) => a.status.done);
  // eslint-disable-next-line react-hooks/purity -- penanda "lewat tenggat" cukup dihitung saat render
  const now = Date.now();

  const taskItem = (a: MyAssignment) => {
    const late = !a.status.done && a.dueAt && new Date(a.dueAt).getTime() < now;
    return (
      <li key={a.id} className="card relative flex flex-col gap-2 p-5 sm:flex-row sm:items-center">
        <span
          className={clsx(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            a.status.done ? "bg-success/15 text-success" : late ? "bg-danger/15 text-danger" : "bg-brand/10 text-brand-ink",
          )}
        >
          <Icon name={a.status.done ? "check" : a.kind === "quiz" ? "sparkles" : "book"} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{a.title}</p>
          <p className="text-sm text-muted">
            {a.classroomName} · {t(`kinds.${a.kind}`)} · {tr(a.courseTitle, locale)}
          </p>
          {a.instructions && <p className="mt-1 whitespace-pre-line text-sm">{a.instructions}</p>}
          <p className={clsx("mt-1 text-xs", late ? "font-semibold text-danger" : "text-muted")}>
            {a.dueAt ? t(late ? "overdue" : "due", { date: formatDate(a.dueAt, locale) }) : t("noDue")}
            {a.status.done && a.status.percent !== undefined && a.status.percent !== null && ` · ${t("score", { percent: a.status.percent })}`}
            {!a.status.done && a.status.total ? ` · ${a.status.done_count ?? 0}/${a.status.total}` : ""}
          </p>
        </div>
        <Link href={target(a)} className={a.status.done ? "btn btn-ghost" : "btn btn-primary"}>
          {a.status.done ? t("open") : t("start")}
          <span className="absolute inset-0" aria-hidden="true" />
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-10">
      <form onSubmit={join} className="card flex flex-col gap-3 p-6 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="class-code" className="mb-1.5 block text-sm font-medium">
            {t("codeLabel")}
          </label>
          <input
            id="class-code"
            className="field font-mono uppercase tracking-widest"
            maxLength={10}
            placeholder="K7M2QX"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>
        <button type="submit" disabled={code.trim().length < 6} className="btn btn-primary">
          {t("join")}
        </button>
      </form>
      {msg && (
        <p role={"error" in msg ? "alert" : "status"} className={"error" in msg ? "-mt-6 text-sm text-danger" : "-mt-6 text-sm text-success"}>
          {"error" in msg ? t(`errors.${msg.error}`) : t("joined", { name: msg.ok })}
        </p>
      )}

      <section aria-labelledby="todo" className="space-y-4">
        <h2 id="todo" className="text-2xl">
          {t("todo")} ({pending.length})
        </h2>
        {classes !== null && pending.length === 0 && <p className="text-muted">{tasks.length ? t("allDone") : t("noTasks")}</p>}
        <ul className="space-y-3">{pending.map(taskItem)}</ul>
      </section>

      {done.length > 0 && (
        <section aria-labelledby="done" className="space-y-4">
          <h2 id="done" className="text-2xl">
            {t("done")} ({done.length})
          </h2>
          <ul className="space-y-3">{done.map(taskItem)}</ul>
        </section>
      )}

      {classes && classes.length > 0 && (
        <section aria-labelledby="mine" className="space-y-3">
          <h2 id="mine" className="text-xl">
            {t("myClasses")}
          </h2>
          <ul className="card divide-y divide-line">
            {classes.map((c) => (
              <li key={c.id} className="flex items-center gap-3 p-4">
                <span className="flex-1 font-medium">{c.name}</span>
                <span className="text-xs text-muted">{formatDate(c.joinedAt, locale)}</span>
                <button type="button" onClick={() => void leave(c)} className="text-xs font-semibold text-muted hover:text-danger">
                  {t("leave")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
