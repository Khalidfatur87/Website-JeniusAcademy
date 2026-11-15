"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { deleteQuestion, replyToQuestion } from "@/lib/cms/actions";
import type { OpenQuestion } from "@/lib/cms/queries";
import { tr } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { SaveStatus, type Status } from "./fields";

function QuestionItem({ q }: { q: OpenQuestion }) {
  const t = useTranslations("admin.discussions");
  const locale = useLocale();
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();

  const send = () => {
    setStatus("saving");
    start(async () => {
      const result = await replyToQuestion(q.id, q.courseSlug, q.lessonId, reply);
      setStatus(result);
      if (result.ok) router.refresh();
    });
  };

  const remove = () => {
    if (!window.confirm(t("confirmDelete"))) return;
    start(async () => {
      const result = await deleteQuestion(q.id);
      setStatus(result);
      if (result.ok) router.refresh();
    });
  };

  return (
    <li className="card space-y-3 p-5">
      <p className="text-xs text-muted">
        <Link href={routes.lesson(q.courseSlug, q.lessonId)} target="_blank" className="font-semibold text-brand-ink hover:underline">
          {tr(q.courseTitle, locale)} · {tr(q.lessonTitle, locale)}
        </Link>
      </p>
      <p className="text-sm">
        <span className="font-semibold">{q.authorName}</span>{" "}
        <span className="text-xs text-muted">{formatDate(q.createdAt, locale)}</span>
      </p>
      <p className="whitespace-pre-line break-words">{q.body}</p>
      <label htmlFor={`reply-${q.id}`} className="sr-only">
        {t("reply")}
      </label>
      <textarea
        id={`reply-${q.id}`}
        rows={3}
        maxLength={2000}
        value={reply}
        placeholder={t("replyPlaceholder")}
        onChange={(e) => setReply(e.target.value)}
        className="field resize-y"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={send} disabled={pending || !reply.trim()} className="btn btn-primary">
          {t("reply")}
        </button>
        <button type="button" onClick={remove} disabled={pending} className="btn btn-ghost">
          {t("delete")}
        </button>
        <SaveStatus status={status} />
      </div>
    </li>
  );
}

export function QuestionsInbox({ questions }: { questions: OpenQuestion[] }) {
  const t = useTranslations("admin.discussions");
  if (questions.length === 0) return <p className="card p-8 text-center text-muted">{t("empty")}</p>;
  return (
    <ul className="space-y-4">
      {questions.map((q) => (
        <QuestionItem key={q.id} q={q} />
      ))}
    </ul>
  );
}
