import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

export function CtaSection() {
  const t = useTranslations("cta");

  return (
    <section className="pb-16">
      <div className="container-page">
        <div className="relative isolate overflow-hidden rounded-3xl bg-brand-strong px-6 py-14 text-center text-on-brand sm:px-12">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 -z-10 size-72 rounded-full bg-white/10 blur-2xl"
          />
          <h2 className="text-[clamp(1.7rem,4vw,2.4rem)]">{t("title")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">{t("subtitle")}</p>
          <Link
            href={routes.register}
            className="btn btn-lg mt-8 bg-white !text-brand-strong hover:bg-white/90"
          >
            {t("button")}
            <Icon name="arrowRight" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
