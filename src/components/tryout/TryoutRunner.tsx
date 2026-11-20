"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { tr } from "@/lib/content";
import { routes } from "@/lib/routes";
import { currentSection, formatClock, type TryoutInfo } from "@/lib/tryout";
import {
  saveTryoutAnswers,
  startTryout,
  submitTryout,
  type Paper,
  type StartError,
} from "@/lib/tryout-client";

/** Subtes yang diselesaikan lebih awal disimpan di perangkat (waktu sisanya hangus). */
const skipKey = (slug: string, startedAt: string) => `ja:tryout:${slug}:${startedAt}`;
const readSkip = (key: string) => {
  try {
    return Number(window.localStorage.getItem(key) ?? -1);
  } catch {
    return -1;
  }
};
const writeSkip = (key: string, value: number) => {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Mode privat: berlaku selama halaman terbuka.
  }
};

/**
 * Lembar ujian try-out. Waktu dihitung dari waktu mulai di server; subtes
 * berjalan berurutan dan tidak bisa kembali ke subtes sebelumnya.
 * Jawaban disimpan otomatis; server menolak jawaban yang dikirim setelah
 * batas waktu (+ toleransi) dan menilai jawaban terakhir yang tersimpan.
 */
export function TryoutRunner({ tryout }: { tryout: TryoutInfo }) {
  const t = useTranslations("tryout");
  const locale = useLocale();
  const router = useRouter();
  const { user, ready } = useAuth();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [error, setError] = useState<StartError | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [skip, setSkip] = useState(-1);
  const [now, setNow] = useState(() => new Date());
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [submitting, setSubmitting] = useState(false);
  const dirty = useRef(false);
  const answersRef = useRef<Record<string, number>>({});
  const submittingRef = useRef(false);
  const notSignedIn = ready && !user;

  const submit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    const result = await submitTryout(tryout.slug, answersRef.current);
    if (result) router.replace(routes.tryout(tryout.slug));
    else {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [tryout.slug, router]);

  // Mulai / lanjutkan.
  useEffect(() => {
    if (!ready || !user) return;
    let alive = true;
    startTryout(tryout.slug).then((r) => {
      if (!alive) return;
      if ("error" in r) return setError(r.error);
      if (r.paper.submitted) return router.replace(routes.tryout(tryout.slug));
      const skipped = readSkip(skipKey(tryout.slug, r.paper.startedAt));
      answersRef.current = r.paper.answers;
      setPaper(r.paper);
      setAnswers(r.paper.answers);
      setSkip(skipped);
      // Dibuka lagi setelah waktu habis → langsung dinilai.
      if (currentSection(r.paper.sections, r.paper.startedAt, new Date(), skipped).index >= r.paper.sections.length) {
        void submit();
      }
    });
    return () => {
      alive = false;
    };
  }, [ready, user, tryout.slug, router, submit]);

  // Jam; waktu semua subtes habis → serahkan otomatis.
  useEffect(() => {
    if (!paper) return;
    const id = window.setInterval(() => {
      const n = new Date();
      setNow(n);
      if (currentSection(paper.sections, paper.startedAt, n, skip).index >= paper.sections.length) void submit();
    }, 1000);
    return () => window.clearInterval(id);
  }, [paper, skip, submit]);

  const save = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setSaving("saving");
    const ok = await saveTryoutAnswers(tryout.slug, answersRef.current);
    if (!ok) dirty.current = true;
    setSaving(ok ? "saved" : "failed");
  }, [tryout.slug]);

  // Simpan otomatis: 2 detik setelah menjawab, dan tiap 30 detik.
  useEffect(() => {
    if (!paper) return;
    const id = window.setTimeout(() => void save(), 2000);
    return () => window.clearTimeout(id);
  }, [answers, paper, save]);
  useEffect(() => {
    if (!paper) return;
    const id = window.setInterval(() => void save(), 30_000);
    return () => window.clearInterval(id);
  }, [paper, save]);

  const sections = paper?.sections ?? [];
  const cur = paper ? currentSection(sections, paper.startedAt, now, skip) : { index: 0, secondsLeft: 0 };
  const finished = paper !== null && cur.index >= sections.length;

  const shownError: StartError | null = notSignedIn ? "notSignedIn" : error;
  if (shownError) {
    return (
      <div className="container-page section">
        <div className="card mx-auto max-w-lg space-y-4 p-8 text-center">
          <Icon name={shownError === "noAccess" ? "lock" : "clock"} size={28} className="mx-auto text-muted" />
          <p>{t(`errors.${shownError}`)}</p>
          <Link href={shownError === "notSignedIn" ? routes.login : routes.tryout(tryout.slug)} className="btn btn-primary">
            {shownError === "notSignedIn" ? t("login") : t("back")}
          </Link>
        </div>
      </div>
    );
  }

  if (!paper || finished) {
    return (
      <div className="container-page section text-center text-muted" aria-busy="true">
        {finished ? t("submitting") : t("loading")}
      </div>
    );
  }

  const section = sections[cur.index];
  const isLast = cur.index === sections.length - 1;
  const answeredHere = section.questions.filter((q) => answers[q.id] !== undefined).length;
  const lowTime = cur.secondsLeft <= 60;

  const choose = (qid: string, oi: number) => {
    const next = { ...answersRef.current, [qid]: oi };
    answersRef.current = next;
    dirty.current = true;
    setAnswers(next);
  };

  const finishSection = async () => {
    const unanswered = section.questions.length - answeredHere;
    const msg = isLast
      ? t("confirmSubmit", { count: unanswered })
      : t("confirmNext", { count: unanswered });
    if (!window.confirm(msg)) return;
    await save();
    if (isLast) return void submit();
    writeSkip(skipKey(tryout.slug, paper.startedAt), cur.index);
    setSkip(cur.index);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-line bg-page/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("sectionOf", { current: cur.index + 1, total: sections.length })}
            </p>
            <h1 className="truncate text-lg">{tr(section.title, locale)}</h1>
          </div>
          <p
            role="timer"
            aria-live={lowTime ? "assertive" : "off"}
            className={clsx(
              "rounded-xl px-3 py-1.5 font-mono text-xl font-bold tabular-nums",
              lowTime ? "bg-danger/15 text-danger" : "bg-surface-2",
            )}
          >
            <span className="sr-only">{t("timeLeft")}: </span>
            {formatClock(cur.secondsLeft)}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>{t("answeredOf", { answered: answeredHere, total: section.questions.length })}</span>
          <span aria-live="polite">
            {saving === "saving" ? t("saving") : saving === "saved" ? t("saved") : saving === "failed" ? t("saveFailed") : ""}
          </span>
        </div>
        <nav aria-label={t("questionNav")} className="mt-2 flex flex-wrap gap-1.5">
          {section.questions.map((q, i) => (
            <a
              key={q.id}
              href={`#q-${q.id}`}
              className={clsx(
                "grid size-8 place-items-center rounded-lg text-xs font-semibold",
                answers[q.id] !== undefined ? "bg-brand-strong text-on-brand" : "bg-surface-2 text-muted",
              )}
            >
              {i + 1}
            </a>
          ))}
        </nav>
      </div>

      <ol className="mx-auto max-w-3xl space-y-5">
        {section.questions.map((q, i) => {
          const labelId = `q-${q.id}-label`;
          return (
            <li key={q.id} id={`q-${q.id}`} className="card scroll-mt-48 space-y-3 p-5 sm:p-6">
              <h2 id={labelId} className="text-base font-semibold sm:text-lg">
                <span className="mr-2 text-muted">{i + 1}.</span>
                {tr(q.prompt, locale)}
              </h2>
              <div role="radiogroup" aria-labelledby={labelId} className="space-y-2">
                {q.options.map((o, oi) => {
                  const chosen = answers[q.id] === oi;
                  return (
                    <label
                      key={oi}
                      className={clsx(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                        chosen ? "border-brand bg-brand/10" : "border-line hover:border-brand",
                      )}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={chosen}
                        onChange={() => choose(q.id, oi)}
                        className="mt-1 accent-[var(--brand)]"
                      />
                      <span className="flex-1">{tr(o, locale)}</span>
                    </label>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center gap-3">
        <button type="button" onClick={() => void finishSection()} disabled={submitting} className="btn btn-primary btn-lg">
          {isLast ? t("submit") : t("nextSection")}
        </button>
        <p className="text-sm text-muted">{isLast ? t("submitHint") : t("nextHint")}</p>
      </div>
    </div>
  );
}
