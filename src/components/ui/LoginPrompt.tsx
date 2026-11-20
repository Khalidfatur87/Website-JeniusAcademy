"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

/** Kartu "masuk dulu" untuk halaman yang butuh akun. */
export function LoginPrompt({ message }: { message: string }) {
  const t = useTranslations("nav");
  return (
    <div className="card mx-auto max-w-lg space-y-4 p-8 text-center">
      <p className="text-muted">{message}</p>
      <div className="flex justify-center gap-2">
        <Link href={routes.login} className="btn btn-primary">
          {t("login")}
        </Link>
        <Link href={routes.register} className="btn btn-ghost">
          {t("register")}
        </Link>
      </div>
    </div>
  );
}
