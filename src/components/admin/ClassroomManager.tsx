"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { useRouter } from "@/i18n/navigation";
import {
  deleteAssignment,
  deleteClassroom,
  removeClassroomMember,
  saveAssignment,
  setClassroomSponsor,
  updateClassroom,
} from "@/lib/cms/actions";
import type { ClassroomDetail } from "@/lib/cms/queries";
import { tr, type Course, type Level } from "@/lib/content";
import { formatDate, fromLocalInput } from "@/lib/format";
import { routes } from "@/lib/routes";
import { Field, SaveStatus, type Status } from "./fields";

type CourseOption = Pick<Course, "slug" | "title" | "lessons">;
type ActionFn = () => Promise<{ ok: boolean } & Record<string, unknown>>;

function useAction() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();
  const run = (fn: ActionFn, after?: () => void) => {
    setStatus("saving");
    start(async () => {
      const result = (await fn()) as Exclude<Status, "idle" | "saving" | "saved">;
      setStatus(result);
      if (result.ok) {
        after?.();
        router.refresh();
      }
    });
  };
  return { status, pending, run };
}

function AssignmentForm({ classroomId, courses }: { classroomId: string; courses: CourseOption[] }) {
  const t = useTranslations("admin.classrooms");
  const locale = useLocale();
  const id = useId();
  const { status, pending, run } = useAction();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [kind, setKind] = useState<"lesson" | "quiz" | "course">("lesson");
  const [courseSlug, setCourseSlug] = useState(courses[0]?.slug ?? "");
  const [lessonId, setLessonId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const course = courses.find((c) => c.slug === courseSlug);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(
      () =>
        saveAssignment(classroomId, {
          title,
          instructions,
          kind,
          courseSlug,
          lessonId: kind === "lesson" ? lessonId || null : null,
          dueAt: fromLocalInput(dueAt),
        }),
      () => {
        setTitle("");
        setInstructions("");
      },
    );
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h3 className="text-lg">{t("newAssignment")}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={t("assignmentTitle")} htmlFor={`${id}-t`}>
          <input id={`${id}-t`} className="field" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label={t("kind")} htmlFor={`${id}-k`}>
          <select id={`${id}-k`} className="field" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="lesson">{t("kinds.lesson")}</option>
            <option value="quiz">{t("kinds.quiz")}</option>
            <option value="course">{t("kinds.course")}</option>
          </select>
        </Field>
        <Field label={t("course")} htmlFor={`${id}-c`}>
          <select
            id={`${id}-c`}
            className="field"
            value={courseSlug}
            onChange={(e) => {
              setCourseSlug(e.target.value);
              setLessonId("");
            }}
          >
            {courses.map((c) => (
              <option key={c.slug} value={c.slug}>
                {tr(c.title, locale)}
              </option>
            ))}
          </select>
        </Field>
        {kind === "lesson" && (
          <Field label={t("lesson")} htmlFor={`${id}-l`}>
            <select id={`${id}-l`} className="field" value={lessonId} onChange={(e) => setLessonId(e.target.value)} required>
              <option value="">{t("chooseLesson")}</option>
              {course?.lessons.map((l, i) => (
                <option key={l.id} value={l.id}>
                  {i + 1}. {tr(l.title, locale)}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={t("dueAt")} htmlFor={`${id}-d`}>
          <input id={`${id}-d`} type="datetime-local" className="field" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </Field>
      </div>
      <Field label={t("instructions")} htmlFor={`${id}-i`}>
        <textarea id={`${id}-i`} rows={2} maxLength={2000} className="field resize-y" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {t("addAssignment")}
        </button>
        <SaveStatus status={status} />
      </div>
    </form>
  );
}

/** Kelola satu kelas sekolah: kode gabung, anggota, tugas, laporan, sponsor akses. */
export function ClassroomManager({
  classroom,
  courses,
  levels,
  isSuperAdmin,
}: {
  classroom: ClassroomDetail;
  courses: CourseOption[];
  levels: Level[];
  isSuperAdmin: boolean;
}) {
  const t = useTranslations("admin.classrooms");
  const tAdmin = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const { status, pending, run } = useAction();
  const [name, setName] = useState(classroom.name);
  const [copied, setCopied] = useState(false);
  const courseTitle = (slug: string) => tr(courses.find((c) => c.slug === slug)?.title, locale) || slug;
  const statusOf = (studentId: string, assignmentId: string) =>
    classroom.report.find((r) => r.studentId === studentId && r.assignmentId === assignmentId)?.status;

  const copy = async () => {
    await navigator.clipboard.writeText(classroom.joinCode).catch(() => {});
    setCopied(true);
  };

  return (
    <div className="space-y-10">
      <section className="card grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm text-muted">{t("codeHint")}</p>
          <p className="flex items-center gap-3">
            <span className="font-mono text-3xl font-bold tracking-[0.25em]">{classroom.joinCode}</span>
            <button type="button" onClick={() => void copy()} className="btn btn-ghost">
              {copied ? t("copied") : t("copy")}
            </button>
          </p>
        </div>
        <div className="space-y-3">
          <label htmlFor="class-name" className="block text-sm font-medium">
            {t("name")}
          </label>
          <div className="flex gap-2">
            <input id="class-name" className="field" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
            <button type="button" disabled={pending} onClick={() => run(() => updateClassroom(classroom.id, { name }))} className="btn btn-primary">
              {tAdmin("save")}
            </button>
          </div>
          {isSuperAdmin && (
            <div>
              <label htmlFor="class-sponsor" className="mb-1.5 block text-sm font-medium">
                {t("sponsor")}
              </label>
              <select
                id="class-sponsor"
                className="field"
                value={classroom.sponsorLevelId ?? ""}
                onChange={(e) => run(() => setClassroomSponsor(classroom.id, e.target.value || null))}
              >
                <option value="">{t("noSponsor")}</option>
                {levels
                  .filter((l) => l.price > 0)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {tr(l.name, locale)}
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-muted">{t("sponsorHint")}</p>
            </div>
          )}
          <SaveStatus status={status} />
        </div>
      </section>

      <section aria-labelledby="assignments" className="space-y-4">
        <h3 id="assignments" className="text-xl">
          {t("assignments")} ({classroom.assignments.length})
        </h3>
        <AssignmentForm classroomId={classroom.id} courses={courses} />
        {classroom.assignments.length > 0 && (
          <ul className="space-y-2">
            {classroom.assignments.map((a) => {
              const done = classroom.roster.filter((m) => statusOf(m.studentId, a.id)?.done).length;
              return (
                <li key={a.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-sm text-muted">
                      {t(`kinds.${a.kind}`)} · {courseTitle(a.courseSlug)}
                      {a.dueAt && ` · ${t("due", { date: formatDate(a.dueAt, locale) })}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{t("doneCount", { done, total: classroom.roster.length })}</span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => window.confirm(t("confirmDeleteAssignment")) && run(() => deleteAssignment(a.id))}
                    className="rounded p-1 text-muted hover:text-danger"
                    aria-label={tAdmin("delete")}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="report" className="space-y-4">
        <h3 id="report" className="text-xl">
          {t("report")} ({t("members", { count: classroom.roster.length })})
        </h3>
        {classroom.roster.length === 0 ? (
          <p className="card p-6 text-center text-muted">{t("noMembers")}</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="p-3">
                    {t("student")}
                  </th>
                  {classroom.assignments.map((a) => (
                    <th key={a.id} scope="col" className="max-w-[10rem] truncate p-3 font-medium" title={a.title}>
                      {a.title}
                    </th>
                  ))}
                  <th scope="col" className="p-3">
                    <span className="sr-only">{t("remove")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {classroom.roster.map((m) => (
                  <tr key={m.studentId} className="border-b border-line last:border-0">
                    <th scope="row" className="p-3 text-left font-medium">
                      {m.name}
                    </th>
                    {classroom.assignments.map((a) => {
                      const st = statusOf(m.studentId, a.id);
                      const label = st?.done
                        ? st.percent !== undefined && st.percent !== null
                          ? `${st.percent}%`
                          : t("done")
                        : st?.total
                          ? `${st.done_count ?? 0}/${st.total}`
                          : t("notDone");
                      return (
                        <td key={a.id} className="p-3">
                          <span
                            className={clsx(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                              st?.done ? "bg-success/15 text-success" : "bg-surface-2 text-muted",
                            )}
                          >
                            {st?.done && <Icon name="check" size={12} />}
                            {label}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          window.confirm(t("confirmRemove", { name: m.name })) &&
                          run(() => removeClassroomMember(classroom.id, m.studentId))
                        }
                        className="text-xs font-semibold text-muted hover:text-danger"
                      >
                        {t("remove")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-wrap gap-3 border-t border-line pt-8">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => updateClassroom(classroom.id, { archived: !classroom.archived }))}
          className="btn btn-ghost"
        >
          {classroom.archived ? t("unarchive") : t("archive")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            window.confirm(t("confirmDelete", { name: classroom.name })) &&
            run(() => deleteClassroom(classroom.id), () => router.push(routes.adminClassrooms))
          }
          className="btn btn-ghost border-danger text-danger"
        >
          {t("delete")}
        </button>
      </section>
    </div>
  );
}
