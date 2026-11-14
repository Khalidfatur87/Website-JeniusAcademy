import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { Link, redirect } from "@/i18n/navigation";
import { getViewer, isStaff } from "@/lib/cms/session";
import { routes } from "@/lib/routes";

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/** CMS: hanya untuk guru dan super admin. Setiap halaman di bawahnya memeriksa ulang aksesnya. */
export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const session = await getViewer();
  if (!session) return redirect({ href: routes.login, locale });
  const { viewer } = session;

  if (!isStaff(viewer.role)) {
    return (
      <>
        <PageHeader title={t("noAccessTitle")} subtitle={t("noAccessText")} />
        <div className="container-page section">
          <Link href={routes.dashboard} className="btn btn-primary">
            {t("toDashboard")}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("signedInAs", { name: viewer.name, role: t(`roles.${viewer.role}`) })}
      />
      <div className="container-page section grid grid-cols-1 gap-8 lg:grid-cols-[13rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AdminNav role={viewer.role} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
