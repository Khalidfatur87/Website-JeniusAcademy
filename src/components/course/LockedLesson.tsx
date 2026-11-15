"use client";

import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { Link } from "@/i18n/navigation";
import { firstPreview } from "@/lib/access";
import { useAuth } from "@/lib/auth";
import { tr, type Course } from "@/lib/content";
import { formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { SubscribeCta } from "./SubscribeCta";

/** Pengganti video untuk pelajaran yang terkunci. */
export function LockedLesson({
  course,
  currentId,
  inline,
}: {
  course: Course;
  currentId: string;
  /** true: kartu biasa (mis. di halaman kuis), bukan pengganti video 16:9. */
  inline?: boolean;
}) {
  const t = useTranslations("access");
  const locale = useLocale();
  const { user } = useAuth();
  const preview = firstPreview(course);

  return (
    <div
      className={`grid place-items-center rounded-2xl border border-line bg-surface-2 p-6 text-center ${
        inline ? "py-12" : "aspect-video"
      }`}
    >
      <div className="max-w-md space-y-4">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand/10 text-brand-ink">
          <Icon name="lock" size={26} />
        </span>
        <h2 className="text-xl">{t("lockedTitle")}</h2>
        <p className="text-sm text-muted">
          {t("lockedText", {
            level: tr(course.level.name, locale),
            price: formatPrice(course.level.price, locale),
          })}
        </p>
        <div className="flex justify-center">
          <SubscribeCta level={course.level} />
        </div>
        {!user && (
          <p className="text-sm text-muted">
            {t("alreadySubscribed")}{" "}
            <Link href={routes.login} className="font-semibold text-brand-ink hover:underline">
              {t("login")}
            </Link>
          </p>
        )}
        {preview && preview.id !== currentId && (
          <Link href={routes.lesson(course.slug, preview.id)} className="inline-block text-sm font-semibold text-brand-ink hover:underline">
            {t("tryPreview")}
          </Link>
        )}
      </div>
    </div>
  );
}
