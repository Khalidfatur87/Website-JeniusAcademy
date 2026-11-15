"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import {
  COMMENT_MAX,
  deleteComment,
  listComments,
  postComment,
  threads,
  type LessonComment,
} from "@/lib/comments";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";

function CommentForm({
  onSubmit,
  placeholder,
  submitLabel,
  autoFocus,
}: {
  onSubmit: (body: string) => Promise<boolean>;
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
}) {
  const t = useTranslations("discussion");
  const id = useId();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    setFailed(false);
    const ok = await onSubmit(body);
    setBusy(false);
    if (ok) setBody("");
    else setFailed(true);
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <textarea
        id={id}
        rows={3}
        maxLength={COMMENT_MAX}
        value={body}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => setBody(e.target.value)}
        className="field resize-y"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy || !body.trim()} className="btn btn-primary">
          {submitLabel}
        </button>
        {failed && (
          <span role="alert" className="text-sm text-danger">
            {t("failed")}
          </span>
        )}
      </div>
    </form>
  );
}

function CommentItem({ c, onDelete }: { c: LessonComment; onDelete: (id: string) => void }) {
  const t = useTranslations("discussion");
  const roles = useTranslations("admin.roles");
  const locale = useLocale();
  const staff = c.authorRole !== "student";

  return (
    <div className="flex gap-3">
      <Avatar name={c.authorName} src={c.authorAvatar} size="size-9" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-sm">
          <span className="font-semibold">{c.authorName}</span>
          {staff && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[0.7rem] font-semibold text-brand-ink">
              {roles(c.authorRole)}
            </span>
          )}
          <span className="text-xs text-muted">{formatDate(c.createdAt, locale)}</span>
        </p>
        <p className="mt-1 whitespace-pre-line break-words text-sm">{c.body}</p>
        {c.canDelete && (
          <button
            type="button"
            onClick={() => window.confirm(t("confirmDelete")) && onDelete(c.id)}
            className="mt-1 text-xs font-semibold text-muted hover:text-danger"
          >
            {t("delete")}
          </button>
        )}
      </div>
    </div>
  );
}

/** Tanya jawab per pelajaran: siswa bertanya, guru (dan siswa lain) menjawab. */
export function LessonDiscussion({ slug, lessonId }: { slug: string; lessonId: string }) {
  const t = useTranslations("discussion");
  const { user, ready } = useAuth();
  const userId = user?.id ?? null;
  const [items, setItems] = useState<LessonComment[] | null>(null);
  const [error, setError] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await listComments(slug, lessonId));
      setError(false);
    } catch {
      setError(true);
    }
  }, [slug, lessonId]);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    listComments(slug, lessonId)
      .then((list) => {
        if (!alive) return;
        setItems(list);
        setError(false);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [userId, slug, lessonId]);

  const post = async (body: string, parentId: string | null) => {
    if (!userId) return false;
    const ok = await postComment(userId, slug, lessonId, body, parentId);
    if (ok) {
      setReplyTo(null);
      await load();
    }
    return ok;
  };

  const remove = async (id: string) => {
    if (await deleteComment(id)) await load();
  };

  const list = items ? threads(items) : [];

  return (
    <section aria-labelledby="discussion-heading" className="space-y-5">
      <h2 id="discussion-heading" className="flex items-center gap-2 text-xl">
        <Icon name="chat" size={20} />
        {t("title")}
        {items && <span className="text-base font-normal text-muted">({list.length})</span>}
      </h2>

      {!ready ? null : !user ? (
        <p className="card p-5 text-sm text-muted">
          {t("loginToAsk")}{" "}
          <Link href={routes.login} className="font-semibold text-brand-ink hover:underline">
            {t("login")}
          </Link>
        </p>
      ) : (
        <>
          <CommentForm
            onSubmit={(body) => post(body, null)}
            placeholder={t("askPlaceholder")}
            submitLabel={t("ask")}
          />

          {error && <p className="text-sm text-danger">{t("loadFailed")}</p>}
          {items && list.length === 0 && <p className="text-sm text-muted">{t("empty")}</p>}

          <ul className="space-y-4">
            {list.map(({ question, replies }) => (
              <li key={question.id} className="card space-y-4 p-4 sm:p-5">
                <CommentItem c={question} onDelete={remove} />
                {replies.length > 0 && (
                  <ul className="space-y-4 border-l-2 border-line pl-4 sm:ml-12">
                    {replies.map((r) => (
                      <li key={r.id}>
                        <CommentItem c={r} onDelete={remove} />
                      </li>
                    ))}
                  </ul>
                )}
                <div className="sm:ml-12">
                  {replyTo === question.id ? (
                    <CommentForm
                      onSubmit={(body) => post(body, question.id)}
                      placeholder={t("replyPlaceholder")}
                      submitLabel={t("reply")}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReplyTo(question.id)}
                      className="text-sm font-semibold text-brand-ink hover:underline"
                    >
                      {t("reply")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
