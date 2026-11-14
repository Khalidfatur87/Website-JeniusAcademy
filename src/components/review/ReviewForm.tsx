"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import { FormField, fieldProps } from "@/components/ui/FormField";
import { Icon } from "@/components/ui/Icon";
import { levels, tr, type LevelId } from "@/config/courses";
import type { Review } from "@/config/reviews";
import type { ReviewInput } from "@/lib/user-reviews";

const MIN_OPINION = 10;

type Errors = Partial<Record<"name" | "rating" | "opinion", string>>;

export function ReviewForm({
  defaultName,
  onSubmit,
}: {
  /** Nama akun yang login (baru tersedia setelah hydration). */
  defaultName: string;
  /** Mengembalikan true jika ulasan berhasil dikirim. */
  onSubmit: (review: ReviewInput) => Promise<boolean>;
}) {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const id = useId();
  // null = belum diedit → pakai nama akun.
  const [typedName, setName] = useState<string | null>(null);
  const name = typedName ?? defaultName;
  const [levelId, setLevelId] = useState<LevelId>("sma");
  const [rating, setRating] = useState(0);
  const [opinion, setOpinion] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = t("errorName");
    if (!rating) next.rating = t("errorRating");
    if (opinion.trim().length < MIN_OPINION) next.opinion = t("errorOpinion");
    setErrors(next);
    setSent(false);
    setFailed(false);
    if (busy || Object.keys(next).length) return;

    setBusy(true);
    const ok = await onSubmit({
      name: name.trim(),
      levelId,
      rating: rating as Review["rating"],
      body: opinion.trim(),
    });
    setBusy(false);
    if (!ok) return setFailed(true);
    setOpinion("");
    setRating(0);
    setSent(true);
  };

  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-6">
      <h2 className="text-xl">{t("formTitle")}</h2>

      <FormField id={`${id}-name`} label={t("name")} error={errors.name}>
        <input
          {...fieldProps(`${id}-name`, errors.name)}
          className="field"
          value={name}
          placeholder={t("namePlaceholder")}
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>

      <FormField id={`${id}-level`} label={t("level")}>
        <select
          id={`${id}-level`}
          className="field"
          value={levelId}
          onChange={(e) => setLevelId(e.target.value as LevelId)}
        >
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {tr(l.name, locale)}
            </option>
          ))}
        </select>
      </FormField>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">{t("rating")}</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={t("ratingStars", { count: n })}
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
              className={clsx(
                "rounded-lg p-1.5 transition hover:scale-110",
                n <= rating ? "text-accent" : "text-line hover:text-accent/60",
              )}
            >
              <Icon name="star" size={28} />
            </button>
          ))}
        </div>
        {errors.rating && <p className="mt-1 text-sm text-danger">{errors.rating}</p>}
      </fieldset>

      <FormField id={`${id}-op`} label={t("opinion")} error={errors.opinion}>
        <textarea
          {...fieldProps(`${id}-op`, errors.opinion)}
          rows={4}
          className="field resize-y"
          value={opinion}
          placeholder={t("opinionPlaceholder")}
          onChange={(e) => setOpinion(e.target.value)}
        />
      </FormField>

      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {t("submit")}
      </button>

      <p role="status" className="text-sm text-success">
        {sent ? t("thanks") : ""}
      </p>
      {failed && (
        <p role="alert" className="text-sm text-danger">
          {t("errorSubmit")}
        </p>
      )}
      <p className="text-xs text-muted">{t("moderationNote")}</p>
    </form>
  );
}
