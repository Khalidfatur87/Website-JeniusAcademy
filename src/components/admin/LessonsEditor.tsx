"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { useRouter } from "@/i18n/navigation";
import { saveLessons } from "@/lib/cms/actions";
import type { AdminCourse } from "@/lib/cms/queries";
import type { L10n } from "@/lib/content";
import { DragHandle, emptyL10n, Field, L10nInput, move, RowButton, SaveStatus, useDragSort, type Status } from "./fields";
import { MaterialsEditor } from "./MaterialsEditor";

type Row = {
  key: string;
  id?: string;
  title: L10n;
  minutes: number;
  video: string;
  notes: L10n;
  freePreview: boolean;
};

let counter = 0;
const newKey = () => `new-${++counter}`;

/** Daftar pelajaran kelas: tambah, ubah, urutkan, hapus — disimpan sekaligus. */
export function LessonsEditor({ slug, lessons }: { slug: string; lessons: AdminCourse["lessons"] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const id = useId();
  const [rows, setRows] = useState<Row[]>(() =>
    lessons.map((l) => ({
      key: l.id,
      id: l.id,
      title: l.title,
      minutes: l.minutes,
      video: l.youtubeId,
      notes: { ...emptyL10n(), ...l.notes },
      freePreview: l.freePreview,
    })),
  );
  const drag = useDragSort(setRows);
  const materialsOf = (lessonId?: string) => lessons.find((l) => l.id === lessonId)?.materials ?? [];
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();

  const update = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  const add = () =>
    setRows((r) => [
      ...r,
      { key: newKey(), title: emptyL10n(), minutes: 10, video: "", notes: emptyL10n(), freePreview: false },
    ]);

  const remove = (i: number) => {
    if (rows[i].id && !window.confirm(t("lessons.confirmDelete"))) return;
    setRows((r) => r.filter((_, j) => j !== i));
  };

  const save = () => {
    setStatus("saving");
    start(async () => {
      const result = await saveLessons(
        slug,
        rows.map(({ id: lessonId, title, minutes, video, notes, freePreview }) => ({
          id: lessonId,
          title,
          minutes,
          video,
          notes,
          freePreview,
        })),
      );
      setStatus(result);
      if (result.ok) router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {rows.length === 0 && <p className="card p-6 text-center text-muted">{t("lessons.empty")}</p>}

      <ol className="space-y-4">
        {rows.map((row, i) => {
          const { className: dragClass, ...dragProps } = drag.item(i);
          return (
          <li key={row.key} {...dragProps} className={`card space-y-4 p-5 transition ${dragClass}`}>
            <div className="flex items-center gap-2">
              <DragHandle label={t("dragToSort")} {...drag.handle(i)} />
              <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-sm font-bold">
                {i + 1}
              </span>
              <span className="flex-1 text-xs text-muted">
                {row.id ? `id: ${row.id}` : t("lessons.new")}
              </span>
              <RowButton label={t("moveUp")} onClick={() => setRows((r) => move(r, i, -1))} disabled={i === 0}>
                ↑
              </RowButton>
              <RowButton
                label={t("moveDown")}
                onClick={() => setRows((r) => move(r, i, 1))}
                disabled={i === rows.length - 1}
              >
                ↓
              </RowButton>
              <RowButton label={t("delete")} onClick={() => remove(i)} danger>
                <Icon name="x" size={16} />
              </RowButton>
            </div>

            <L10nInput
              label={t("lessons.title")}
              value={row.title}
              onChange={(title) => update(i, { title })}
              required
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_9rem]">
              <Field label={t("lessons.video")} htmlFor={`${id}-${row.key}-v`} hint={t("lessons.videoHint")}>
                <input
                  id={`${id}-${row.key}-v`}
                  className="field"
                  value={row.video}
                  placeholder="https://www.youtube.com/watch?v=…"
                  onChange={(e) => update(i, { video: e.target.value })}
                />
              </Field>
              <Field label={t("lessons.minutes")} htmlFor={`${id}-${row.key}-m`}>
                <input
                  id={`${id}-${row.key}-m`}
                  type="number"
                  min={1}
                  max={600}
                  className="field"
                  value={row.minutes}
                  onChange={(e) => update(i, { minutes: Number(e.target.value) })}
                />
              </Field>
            </div>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={row.freePreview}
                onChange={(e) => update(i, { freePreview: e.target.checked })}
                className="mt-0.5 size-4 accent-[var(--brand)]"
              />
              <span>
                <span className="font-medium">{t("lessons.freePreview")}</span>
                <span className="block text-xs text-muted">{t("lessons.freePreviewHint")}</span>
              </span>
            </label>

            <L10nInput
              label={t("lessons.notes")}
              value={row.notes}
              onChange={(notes) => update(i, { notes })}
              multiline
            />

            {row.id ? (
              <MaterialsEditor slug={slug} lessonId={row.id} materials={materialsOf(row.id)} />
            ) : (
              <p className="text-xs text-muted">{t("materials.saveFirst")}</p>
            )}
          </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={add} className="btn btn-ghost">
          + {t("lessons.add")}
        </button>
        <button type="button" onClick={save} disabled={pending} className="btn btn-primary">
          {t("lessons.save")}
        </button>
        <SaveStatus status={status} rowLabel={t("lessons.row")} />
      </div>
    </div>
  );
}
