import { getTranslations } from "next-intl/server";
import { ReviewsModeration } from "@/components/admin/ReviewsModeration";
import { requireSuperAdmin } from "@/lib/cms/guard";
import { listLevels, listReviews } from "@/lib/cms/queries";

export default async function ReviewsAdminPage() {
  const t = await getTranslations("admin");
  const s = await requireSuperAdmin();
  if (!s) return <p className="card p-8 text-muted">{t("superOnly")}</p>;
  const [reviews, levels] = await Promise.all([listReviews(s.sb), listLevels(s.sb)]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">{t("reviews.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("reviews.subtitle")}</p>
      </div>
      <ReviewsModeration reviews={reviews} levels={levels} />
    </div>
  );
}
