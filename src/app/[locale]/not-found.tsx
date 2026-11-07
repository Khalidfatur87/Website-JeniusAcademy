import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="container-page grid min-h-[60dvh] place-items-center py-20 text-center">
      <div>
        <p className="text-8xl font-bold text-gradient">404</p>
        <h1 className="mt-4 text-3xl">{t("title")}</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">{t("text")}</p>
        <Link href={routes.home} className="btn btn-primary btn-lg mt-8">
          <Icon name="chevronLeft" size={18} />
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
