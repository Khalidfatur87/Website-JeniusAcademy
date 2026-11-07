import { useTranslations } from "next-intl";
import { ReviewCard } from "@/components/review/ReviewCard";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { seedReviews } from "@/config/reviews";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

const FEATURED_COUNT = 3;

export function TestimonialsSection() {
  const t = useTranslations("testimonials");

  return (
    <section className="section bg-surface-2">
      <div className="container-page">
        <SectionHeading title={t("title")} subtitle={t("subtitle")} align="left">
          <Link href={routes.reviews} className="btn btn-ghost">
            {t("all")}
            <Icon name="arrowRight" size={16} />
          </Link>
        </SectionHeading>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {seedReviews.slice(0, FEATURED_COUNT).map((r) => (
            <li key={r.id}>
              <ReviewCard review={r} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
