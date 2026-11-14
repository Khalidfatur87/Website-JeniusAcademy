"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Stars } from "@/components/review/ReviewCard";
import { FilterPills } from "@/components/ui/FilterPills";
import { useRouter } from "@/i18n/navigation";
import { deleteReview, setReviewApproved } from "@/lib/cms/actions";
import type { AdminReview } from "@/lib/cms/queries";
import { tr, type Level } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { SaveStatus, type Status } from "./fields";

function ReviewRow({ review, level }: { review: AdminReview; level?: Level }) {
  const t = useTranslations("admin");
  const rt = useTranslations("reviews");
  const locale = useLocale();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();

  const run = (action: () => Promise<Awaited<ReturnType<typeof deleteReview>>>) => {
    setStatus("saving");
    start(async () => {
      const result = await action();
      setStatus(result);
      if (result.ok) router.refresh();
    });
  };

  return (
    <li className="card space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Stars value={review.rating} label={rt("ratingStars", { count: review.rating })} />
        <span
          className={
            review.approved
              ? "rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success"
              : "rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold"
          }
        >
          {review.approved ? t("reviews.approved") : t("reviews.pending")}
        </span>
      </div>
      <blockquote className="whitespace-pre-line">“{review.body}”</blockquote>
      <p className="text-sm text-muted">
        <span className="font-semibold text-ink">{review.name}</span>
        {level && ` · ${tr(level.name, locale)}`} · {formatDate(review.createdAt, locale)}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setReviewApproved(review.id, !review.approved))}
          className={review.approved ? "btn btn-ghost" : "btn btn-primary"}
        >
          {review.approved ? t("reviews.unapprove") : t("reviews.approve")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => window.confirm(t("reviews.confirmDelete")) && run(() => deleteReview(review.id))}
          className="btn btn-ghost text-danger"
        >
          {t("delete")}
        </button>
        <SaveStatus status={status} />
      </div>
    </li>
  );
}

export function ReviewsModeration({ reviews, levels }: { reviews: AdminReview[]; levels: Level[] }) {
  const t = useTranslations("admin");
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const shown = reviews.filter(
    (r) => filter === "all" || (filter === "approved" ? r.approved : !r.approved),
  );
  const pendingCount = reviews.filter((r) => !r.approved).length;

  return (
    <div className="space-y-5">
      <FilterPills
        label={t("reviews.filter")}
        value={filter}
        onChange={setFilter}
        options={[
          { id: "pending", label: `${t("reviews.pending")} (${pendingCount})` },
          { id: "approved", label: t("reviews.approved") },
          { id: "all", label: t("users.all") },
        ]}
      />
      {shown.length ? (
        <ul className="space-y-4">
          {shown.map((r) => (
            <ReviewRow key={r.id} review={r} level={levels.find((l) => l.id === r.levelId)} />
          ))}
        </ul>
      ) : (
        <p className="card p-8 text-center text-muted">{t("reviews.empty")}</p>
      )}
    </div>
  );
}
