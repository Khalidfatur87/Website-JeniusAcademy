import { useLocale, useTranslations } from "next-intl";
import { tr, type Level } from "@/lib/content";
import type { Review } from "@/config/reviews";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

export function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex gap-0.5 text-accent" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={16}
          className={n <= value ? "" : "text-line"}
        />
      ))}
    </span>
  );
}

export function ReviewCard({
  review,
  level,
  highlight,
  pending,
}: {
  review: Review;
  /** Jenjang ulasan (warna avatar + nama). */
  level?: Level;
  highlight?: boolean;
  /** Ulasan milik sendiri yang belum disetujui. */
  pending?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("reviews");
  const initials = review.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <figure
      className={`card flex h-full flex-col p-6 ${highlight ? "ring-2 ring-brand" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <Stars
          value={review.rating}
          label={t("ratingStars", { count: review.rating })}
        />
        {highlight && (
          <span className="eyebrow !py-0.5 text-xs">
            {pending ? t("pending") : t("yours")}
          </span>
        )}
      </div>

      <blockquote className="mt-4 flex-1 text-[0.95rem] leading-relaxed">
        “{tr(review.text, locale)}”
      </blockquote>

      <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
          style={{ background: level?.color ?? "var(--brand)" }}
        >
          {initials}
        </span>
        <span className="min-w-0 text-sm">
          <span className="block truncate font-semibold">{review.name}</span>
          <span className="block text-muted">
            {level && `${tr(level.name, locale)} · `}
            {formatDate(review.date, locale)}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
