"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { routes } from "@/lib/routes";
import { Icon } from "@/components/ui/Icon";

/** Tombol masuk/daftar, atau salam + keluar jika sudah login. */
export function AuthActions({ variant }: { variant: "desktop" | "mobile" }) {
  const t = useTranslations("nav");
  const { user, signOut } = useAuth();
  const firstName = user?.name.split(" ")[0];
  const isStaff = user?.role === "teacher" || user?.role === "super_admin";
  const cmsLink = isStaff && (
    <Link href={routes.admin} className="btn btn-ghost">
      <Icon name="book" size={16} />
      {t("cms")}
    </Link>
  );

  if (user) {
    return variant === "desktop" ? (
      <>
        {cmsLink}
        <Link href={routes.dashboard} className="btn btn-ghost">
          <Icon name="user" size={16} />
          {t("dashboard")}
        </Link>
        <span className="px-2 text-sm font-medium text-muted">
          {t("hello", { name: firstName ?? "" })}
        </span>
        <button type="button" onClick={signOut} className="btn btn-ghost">
          <Icon name="logout" size={16} />
          {t("logout")}
        </button>
      </>
    ) : (
      <>
        <Link href={routes.dashboard} className="btn btn-primary">
          <Icon name="user" size={16} />
          {t("dashboard")}
        </Link>
        {cmsLink}
        <button type="button" onClick={signOut} className="btn btn-ghost">
          <Icon name="logout" size={16} />
          {t("logout")} · {firstName}
        </button>
      </>
    );
  }

  return variant === "desktop" ? (
    <>
      <Link href={routes.login} className="btn btn-ghost">
        {t("login")}
      </Link>
      <Link href={routes.register} className="btn btn-primary">
        {t("register")}
      </Link>
    </>
  ) : (
    <>
      <Link href={routes.register} className="btn btn-primary">
        {t("register")}
      </Link>
      <Link href={routes.login} className="btn btn-ghost">
        {t("login")}
      </Link>
    </>
  );
}
