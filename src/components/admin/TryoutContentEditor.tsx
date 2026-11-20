"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition, type SetStateAction } from "react";
import { Icon } from "@/components/ui/Icon";
import { useRouter } from "@/i18n/navigation";
import { saveTryoutContent } from "@/lib/cms/actions";
import type { AdminTryoutSection } from "@/lib/cms/queries";
import { tr, type L10n } from "@/lib/content";
import { emptyL10n, Field, L10nInput, move, RowButton, type Status } from "./fields";
import { newQuestion, QuestionList, type QuestionRow } from "./QuizEditor";

type SectionDraft = { key: string; title: L10n; minutes: number; questions: QuestionRow[] };

let counter = 0;
const sectionKey = () => `s-${++counter}`;

/** Pesan galat: kode bisa berbentuk "sectionQuestion:<kode soal>" (dari validateTryoutSections). */
function ContentStatus({ status }: { status: Status }) {
  const t = useTranslations("admin");
  if (status === "idle") return <span role="status" />;
  if (status === "saving") return <span role="status" className="text-sm text-muted">{t("saving")}</span>;
  if (status === "saved" || status.ok) return <span role="status" className="text-sm font-medium text-success">{t("saved")}</span>;
  const { code, index } = status.error;
  const inner = code.includes(":") ? code.split(":")[1] : code;
  const msg = t.has(`errors.${inner}`) ? t(`errors.${inner}`) : t("errors.generic");
  return (
    <span role="alert" className="text-sm font-medium text-danger">
      {index !== undefined && `${t("tryouts.section")} ${index + 1}: `}
      {msg}
    </span>
  );
}

/** Subtes (judul, menit) + soal tiap subtes. Disimpan sekaligus; dikunci setelah ada peserta. */
export function TryoutContentEditor({
  slug,
  sections,
  locked,
}: {
  slug: string;
  sections: AdminTryoutSection[];
  locked: boolean;
}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const id = useId();
  const [rows, setRows] = useState<SectionDraft[]>(() =>
    sections.map((s) => ({
      key: s.id,
      title: s.title,
      minutes: s.minutes,
      questions: s.questions.map((q) => ({ key: q.id, ...q })),
    })),
  );
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();

  const update = (i: number, patch: Partial<SectionDraft>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  const setQuestions = (i: number) => (next: SetStateAction<QuestionRow[]>) =>
    setRows((r) =>
      r.map((row, j) => (j === i ? { ...row, questions: typeof next === "function" ? next(row.questions) : next } : row)),
    );

  const save = () => {
    setStatus("saving");
    start(async () => {
      const result = await saveTryoutContent(
        slug,
        rows.map((s) => ({
          title: s.title,
          minutes: s.minutes,
          questions: s.questions.map(({ prompt, options, answer, explanation }) => ({ prompt, options, answer, explanation })),
        })),
      );
      setStatus(result);
      if (result.ok) router.refresh();
    });
  };

  if (locked) {
    return (
      <div className="space-y-3">
        <p className="card p-4 text-sm text-muted">{t("tryouts.locked")}</p>
        <ol className="space-y-2">
          {sections.map((s, i) => (
            <li key={s.id} className="card flex items-center gap-3 p-4">
              <span className="font-semibold">{i + 1}.</span>
              <span className="flex-1">{tr(s.title, locale)}</span>
              <span className="text-sm text-muted">
                {t("tryouts.minutes", { count: s.minutes })} · {t("courses.questionCount", { count: s.questions.length })}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rows.length === 0 && <p className="card p-6 text-center text-muted">{t("tryouts.noSections")}</p>}
      {rows.map((s, i) => (
        <section key={s.key} className="space-y-4 rounded-2xl border-2 border-dashed border-line p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <h3 className="flex-1 text-lg">
              {t("tryouts.section")} {i + 1}
            </h3>
            <RowButton label={t("moveUp")} onClick={() => setRows((r) => move(r, i, -1))} disabled={i === 0}>
              ↑
            </RowButton>
            <RowButton label={t("moveDown")} onClick={() => setRows((r) => move(r, i, 1))} disabled={i === rows.length - 1}>
              ↓
            </RowButton>
            <RowButton
              label={t("delete")}
              onClick={() => window.confirm(t("tryouts.confirmDeleteSection")) && setRows((r) => r.filter((_, j) => j !== i))}
              danger
            >
              <Icon name="x" size={16} />
            </RowButton>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_9rem]">
            <L10nInput label={t("tryouts.sectionTitle")} value={s.title} onChange={(title) => update(i, { title })} required />
            <Field label={t("tryouts.sectionMinutes")} htmlFor={`${id}-${s.key}-m`}>
              <input
                id={`${id}-${s.key}-m`}
                type="number"
                min={1}
                max={300}
                className="field"
                value={s.minutes}
                onChange={(e) => update(i, { minutes: Number(e.target.value) })}
              />
            </Field>
          </div>
          <QuestionList rows={s.questions} setRows={setQuestions(i)} />
        </section>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            setRows((r) => [...r, { key: sectionKey(), title: emptyL10n(), minutes: 30, questions: [newQuestion()] }])
          }
          className="btn btn-ghost"
        >
          + {t("tryouts.addSection")}
        </button>
        <button type="button" onClick={save} disabled={pending} className="btn btn-primary">
          {t("tryouts.saveContent")}
        </button>
        <ContentStatus status={status} />
      </div>
    </div>
  );
}
