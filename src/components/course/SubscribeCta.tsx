"use client";

import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { subscribeContact } from "@/lib/contact";
import { tr, type Level } from "@/lib/content";
import { routes } from "@/lib/routes";

/**
 * Ajakan berlangganan. Pembayaran otomatis belum ada: siswa menghubungi admin,
 * lalu super admin mengaktifkan akses di CMS → Langganan.
 */
export function SubscribeCta({
  level,
  compact,
  hidePlans,
  primary = true,
}: {
  level: Level;
  /** Tombol bertumpuk selebar kolom. */
  compact?: boolean;
  /** Sembunyikan tautan "Lihat paket" (mis. di halaman paket itu sendiri). */
  hidePlans?: boolean;
  primary?: boolean;
}) {
  const t = useTranslations("access");
  const locale = useLocale();
  const { user } = useAuth();
  const levelName = tr(level.name, locale);
  const contact = subscribeContact(
    t("contactMessage", { level: levelName, email: user?.email ?? "-" }),
  );

  const btn = `btn ${primary ? "btn-primary" : "btn-ghost"} w-full${compact ? "" : " sm:w-auto"}`;

  return (
    <div className={compact ? "space-y-2" : "flex flex-col gap-2 sm:flex-row"}>
      {contact.external ? (
        <a href={contact.href} target="_blank" rel="noopener noreferrer" className={btn}>
          <Icon name={contact.href.startsWith("https://wa.me") ? "whatsapp" : "mail"} size={16} />
          {t("subscribe")}
        </a>
      ) : (
        <Link href={contact.href} className={btn}>
          <Icon name="mail" size={16} />
          {t("subscribe")}
        </Link>
      )}
      {!hidePlans && (
        <Link href={routes.pricing} className={`btn btn-ghost w-full${compact ? "" : " sm:w-auto"}`}>
          {t("seePlans")}
        </Link>
      )}
    </div>
  );
}
