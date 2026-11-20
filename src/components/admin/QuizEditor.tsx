"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import { Icon } from "@/components/ui/Icon";
import { localeLabels, locales } from "@/config/site";
import { useRouter } from "@/i18n/navigation";
import { saveQuestions } from "@/lib/cms/actions";
import type { AdminCourse } from "@/lib/cms/queries";
import type { L10n } from "@/lib/content";
import { DragHandle, emptyL10n, L10nInput, move, RowButton, SaveStatus, useDragSort, type Status } from "./fields";

export type QuestionRow = {
  key: string;
  id?: string;
  prompt: L10n;
  options: L10n[];
  answer: number;
  explanation: L10n;
};

const MAX_OPTIONS = 6;
let counter = 0;
const newKey = () => `new-${++counter}`;
type Row = QuestionRow;

export const newQuestion = (): QuestionRow => ({
  key: newKey(),
  prompt: emptyL10n(),
  options: [emptyL10n(), emptyL10n(), emptyL10n(), emptyL10n()],
  answer: 0,
  explanation: emptyL10n(),
});

/**
 * Daftar soal pilihan ganda yang bisa diedit (tambah, ubah, urutkan, hapus).
 * Dipakai editor kuis kelas dan editor subtes try-out.
 */
export function QuestionList({
  rows,
  setRows,
  addLabel,
}: {
  rows: QuestionRow[];
  setRows: Dispatch<SetStateAction<QuestionRow[]>>;
  addLabel?: string;
}) {
  const t = useTranslations("admin");
  const id = useId();
  const drag = useDragSort(setRows);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  const add = () => setRows((r) => [...r, newQuestion()]);

  const remove = (i: number) => {
    if (rows[i].id && !window.confirm(t("quiz.confirmDelete"))) return;
    setRows((r) => r.filter((_, j) => j !== i));
  };

  const setOption = (i: number, oi: number, loc: string, value: string) =>
    update(i, {
      options: rows[i].options.map((o, k) => (k === oi ? { ...o, [loc]: value } : o)),
    });

  const removeOption = (i: number, oi: number) => {
    const row = rows[i];
    const answer = oi === row.answer ? 0 : oi < row.answer ? row.answer - 1 : row.answer;
    update(i, { options: row.options.filter((_, k) => k !== oi), answer });
  };

  return (
    <>
      {rows.length === 0 && <p className="card p-6 text-center text-muted">{t("quiz.empty")}</p>}

      <ol className="space-y-4">
        {rows.map((row, i) => {
          const { className: dragClass, ...dragProps } = drag.item(i);
          return (
          <li key={row.key} {...dragProps} className={`card space-y-4 p-5 transition ${dragClass}`}>
            <div className="flex items-center gap-2">
              <DragHandle label={t("dragToSort")} {...drag.handle(i)} />
              <span className="flex-1 font-semibold">
                {t("quiz.question")} {i + 1}
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
              label={t("quiz.prompt")}
              value={row.prompt}
              onChange={(prompt) => update(i, { prompt })}
              multiline
              required
            />

            <fieldset className="space-y-2">
              <legend className="mb-1.5 text-sm font-medium">
                {t("quiz.options")} <span className="font-normal text-muted">— {t("quiz.optionsHint")}</span>
              </legend>
              {row.options.map((opt, oi) => (
                <div
                  key={oi}
                  className={clsx(
                    "flex items-start gap-3 rounded-xl border p-3",
                    row.answer === oi ? "border-success bg-success/10" : "border-line",
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-${row.key}-answer`}
                    checked={row.answer === oi}
                    onChange={() => update(i, { answer: oi })}
                    aria-label={t("quiz.markCorrect", { number: oi + 1 })}
                    className="mt-3 size-4 accent-[var(--success)]"
                  />
                  <div className="flex-1 space-y-2">
                    {locales.map((loc) => (
                      <div key={loc} className="flex items-center gap-2">
                        <span className="w-8 shrink-0 text-xs font-bold text-muted">
                          {localeLabels[loc].short}
                        </span>
                        <input
                          className="field"
                          aria-label={`${t("quiz.option")} ${oi + 1} (${localeLabels[loc].label})`}
                          value={opt[loc] ?? ""}
                          placeholder={loc === locales[0] ? "" : t("optionalTranslation")}
                          onChange={(e) => setOption(i, oi, loc, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <RowButton
                    label={t("quiz.removeOption")}
                    onClick={() => removeOption(i, oi)}
                    disabled={row.options.length <= 2}
                    danger
                  >
                    <Icon name="x" size={14} />
                  </RowButton>
                </div>
              ))}
              {row.options.length < MAX_OPTIONS && (
                <button
                  type="button"
                  onClick={() => update(i, { options: [...row.options, emptyL10n()] })}
                  className="text-sm font-semibold text-brand-ink hover:underline"
                >
                  + {t("quiz.addOption")}
                </button>
              )}
            </fieldset>

            <L10nInput
              label={t("quiz.explanation")}
              value={row.explanation}
              onChange={(explanation) => update(i, { explanation })}
              multiline
            />
          </li>
          );
        })}
      </ol>
      <button type="button" onClick={add} className="btn btn-ghost">
        + {addLabel ?? t("quiz.add")}
      </button>
    </>
  );
}

/** Bank soal kuis satu kelas — disimpan sekaligus. */
export function QuizEditor({ slug, questions }: { slug: string; questions: AdminCourse["questions"] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => questions.map((q) => ({ key: q.id, ...q })));
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();

  const save = () => {
    setStatus("saving");
    start(async () => {
      const result = await saveQuestions(
        slug,
        rows.map(({ id: qid, prompt, options, answer, explanation }) => ({
          id: qid,
          prompt,
          options,
          answer,
          explanation,
        })),
      );
      setStatus(result);
      if (result.ok) router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("quiz.note")}</p>

      <QuestionList rows={rows} setRows={setRows} />

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="btn btn-primary">
          {t("quiz.save")}
        </button>
        <SaveStatus status={status} rowLabel={t("quiz.question")} />
      </div>
    </div>
  );
}
