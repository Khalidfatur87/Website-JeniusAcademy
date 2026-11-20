"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useId, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { routes } from "@/lib/routes";
import { TUTOR_QUESTION_MAX, type TutorError, type TutorTurn } from "@/lib/tutor";
import { askTutor } from "@/lib/tutor-client";

/** Panel "Tanya AI" di halaman pelajaran. Riwayat hanya di memori halaman. */
export function TutorChat({ slug, lessonId }: { slug: string; lessonId: string }) {
  const t = useTranslations("tutor");
  const locale = useLocale();
  const { user } = useAuth();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<TutorTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TutorError | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  if (!siteConfig.features.tutorAi) return null;

  const ask = async (e: FormEvent) => {
    e.preventDefault();
    const question = draft.trim();
    if (!question || busy) return;
    const history = turns;
    setTurns([...history, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setDraft("");
    setBusy(true);
    setError(null);
    const result = await askTutor({ mode: "lesson", slug, lessonId, question, history, locale }, (chunk) => {
      setTurns((all) => {
        const next = [...all];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, content: last.content + chunk };
        return next;
      });
      endRef.current?.scrollIntoView({ block: "nearest" });
    });
    setBusy(false);
    if (result.ok) setRemaining(result.remaining);
    else {
      setError(result.error);
      setTurns(history); // pertanyaan gagal tidak masuk riwayat
      setDraft(question);
    }
  };

  return (
    <section aria-labelledby={`${id}-h`} className="card overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-5 text-left"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
          <Icon name="sparkles" size={20} />
        </span>
        <span className="flex-1">
          <span id={`${id}-h`} className="block font-semibold">
            {t("title")}
          </span>
          <span className="block text-sm text-muted">{t("subtitle")}</span>
        </span>
        <Icon name="chevronDown" size={18} className={clsx("text-muted transition", open && "rotate-180")} />
      </button>

      {open && (
        <div id={`${id}-panel`} className="space-y-4 border-t border-line p-5">
          {!user ? (
            <p className="text-sm text-muted">
              {t("loginRequired")}{" "}
              <Link href={routes.login} className="font-semibold text-brand-ink hover:underline">
                {t("login")}
              </Link>
            </p>
          ) : (
            <>
              {turns.length === 0 && <p className="text-sm text-muted">{t("empty")}</p>}
              <ul className="max-h-[28rem] space-y-3 overflow-y-auto" aria-live="polite">
                {turns.map((m, i) => (
                  <li
                    key={i}
                    className={clsx(
                      "whitespace-pre-line break-words rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      m.role === "user" ? "ml-8 bg-brand/10" : "mr-8 bg-surface-2",
                    )}
                  >
                    <span className="sr-only">{m.role === "user" ? t("you") : t("tutor")}: </span>
                    {m.content || (busy && i === turns.length - 1 ? t("thinking") : "")}
                  </li>
                ))}
              </ul>
              <div ref={endRef} />
              <form onSubmit={ask} className="space-y-2">
                <label htmlFor={`${id}-q`} className="sr-only">
                  {t("placeholder")}
                </label>
                <textarea
                  id={`${id}-q`}
                  rows={2}
                  maxLength={TUTOR_QUESTION_MAX}
                  value={draft}
                  placeholder={t("placeholder")}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  className="field resize-y"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button type="submit" disabled={busy || !draft.trim()} className="btn btn-primary">
                    {t("ask")}
                  </button>
                  {error && (
                    <span role="alert" className="text-sm text-danger">
                      {t(`errors.${error}`, { limit: siteConfig.ai.dailyLimit })}
                    </span>
                  )}
                  {!error && remaining !== null && (
                    <span className="text-xs text-muted">{t("remaining", { count: remaining })}</span>
                  )}
                </div>
                <p className="text-xs text-muted">{t("disclaimer")}</p>
              </form>
            </>
          )}
        </div>
      )}
    </section>
  );
}
