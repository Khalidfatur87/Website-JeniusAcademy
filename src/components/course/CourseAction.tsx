"use client";

import { useLocale, useTranslations } from "next-intl";
import { firstPreview } from "@/lib/access";
import { tr, type Course } from "@/lib/content";
import { Link } from "@/i18n/navigation";
import { formatDate, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { useProgress } from "@/lib/progress";
import { useCourseAccess } from "@/lib/use-access";
import { Icon } from "@/components/ui/Icon";
import { SubscribeCta } from "./SubscribeCta";

/**
 * Tombol utama di halaman kelas:
 * - punya akses → "Mulai / Lanjutkan / Ulangi" sesuai progres;
 * - kelas berbayar tanpa akses → "Coba gratis" (pratinjau) + ajakan berlangganan.
 */
export function CourseAction({ course }: { course: Course }) {
  const t = useTranslations("course");
  const a = useTranslations("access");
  const locale = useLocale();
  const { doneIds } = useProgress();
  const { access, loaded, free, subscription } = useCourseAccess(course);
  const done = doneIds(course.slug);
  const next = course.lessons.find((l) => !done.includes(l.id));
  const finished = !next;
  const target = next ?? course.lessons[0];
  const levelName = tr(course.level.name, locale);

  if (loaded && !access) {
    const preview = firstPreview(course);
    return (
      <div className="space-y-3">
        <p className="flex items-start gap-2 text-sm">
          <Icon name="lock" size={16} className="mt-0.5 shrink-0 text-muted" />
          <span>
            {a("courseLocked", { level: levelName, price: formatPrice(course.level.price, locale) })}
          </span>
        </p>
        {preview && (
          <Link href={routes.lesson(course.slug, preview.id)} className="btn btn-primary btn-lg w-full">
            <Icon name="play" size={16} />
            {a("tryFree")}
          </Link>
        )}
        <SubscribeCta level={course.level} compact />
      </div>
    );
  }

  const label = finished ? t("review") : done.length ? t("resume") : t("start");

  return (
    <div className="space-y-2">
      <Link href={routes.lesson(course.slug, target.id)} className="btn btn-primary btn-lg w-full">
        <Icon name="play" size={16} />
        {label}
      </Link>
      {!free && subscription && (
        <p className="text-center text-xs text-muted">
          {subscription.expiresAt
            ? a("activeUntil", { date: formatDate(subscription.expiresAt, locale) })
            : a("activeForever")}
        </p>
      )}
    </div>
  );
}
