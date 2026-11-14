"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { saveCourse } from "@/lib/cms/actions";
import type { AdminCourse } from "@/lib/cms/queries";
import { slugify } from "@/lib/cms/validate";
import { tr, type Level } from "@/lib/content";
import { routes } from "@/lib/routes";
import { emptyL10n, Field, L10nInput, SaveStatus, type Status } from "./fields";

export type TeacherOption = { id: string; name: string; email: string };

/** Data dasar kelas: judul, slug, jenjang, ringkasan, pengajar, status terbit. */
export function CourseForm({
  course,
  levels,
  teachers,
}: {
  /** Kosong = membuat kelas baru. */
  course?: AdminCourse;
  levels: Level[];
  /** Pilihan guru (hanya untuk super admin; null = guru yang membuka form). */
  teachers: TeacherOption[] | null;
}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const id = useId();
  const creating = !course;

  const [title, setTitle] = useState(course?.title ?? emptyL10n());
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [levelId, setLevelId] = useState(course?.levelId ?? levels[0]?.id ?? "");
  const [summary, setSummary] = useState(course?.summary ?? emptyL10n());
  const [teacherId, setTeacherId] = useState(course?.teacherId ?? "");
  const [teacherName, setTeacherName] = useState(course?.teacherName ?? "");
  const [published, setPublished] = useState(course?.published ?? false);
  const [position, setPosition] = useState(course?.position ?? 0);
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();

  const onTitle = (next: typeof title) => {
    setTitle(next);
    if (creating && !slugTouched) setSlug(slugify(next.id));
  };

  const onTeacher = (value: string) => {
    setTeacherId(value);
    // Isi nama tampilan otomatis bila masih kosong.
    const picked = teachers?.find((x) => x.id === value);
    if (picked && !teacherName.trim()) setTeacherName(picked.name);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    start(async () => {
      const result = await saveCourse(
        { slug, levelId, title, summary, teacherId: teacherId || null, teacherName, published, position },
        creating ? "create" : "update",
      );
      setStatus(result);
      if (result.ok) {
        if (creating) router.push(routes.adminCourse(slug.trim()));
        else router.refresh();
      }
    });
  };

  return (
    <form onSubmit={submit} className="card space-y-5 p-6">
      <L10nInput label={t("course.title")} value={title} onChange={onTitle} required />

      <Field
        label={t("course.slug")}
        htmlFor={`${id}-slug`}
        hint={creating ? t("course.slugHint") : t("course.slugLocked")}
      >
        <input
          id={`${id}-slug`}
          className="field font-mono"
          value={slug}
          disabled={!creating}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase());
          }}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={t("course.level")} htmlFor={`${id}-level`}>
          <select
            id={`${id}-level`}
            className="field"
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
          >
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {tr(l.name, locale)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("course.position")} htmlFor={`${id}-pos`} hint={t("course.positionHint")}>
          <input
            id={`${id}-pos`}
            type="number"
            step={1}
            className="field"
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
          />
        </Field>
      </div>

      <L10nInput label={t("course.summary")} value={summary} onChange={setSummary} multiline />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {teachers && (
          <Field label={t("course.owner")} htmlFor={`${id}-owner`} hint={t("course.ownerHint")}>
            <select
              id={`${id}-owner`}
              className="field"
              value={teacherId}
              onChange={(e) => onTeacher(e.target.value)}
            >
              <option value="">{t("course.noOwner")}</option>
              {teachers.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} ({x.email})
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={t("course.teacherName")} htmlFor={`${id}-tname`} hint={t("course.teacherNameHint")}>
          <input
            id={`${id}-tname`}
            className="field"
            value={teacherName}
            maxLength={80}
            onChange={(e) => setTeacherName(e.target.value)}
          />
        </Field>
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="mt-1 size-4 accent-[var(--brand)]"
        />
        <span>
          <span className="block font-medium">{t("course.published")}</span>
          <span className="block text-xs text-muted">{t("course.publishedHint")}</span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {creating ? t("course.create") : t("save")}
        </button>
        <SaveStatus status={status} />
      </div>
    </form>
  );
}
