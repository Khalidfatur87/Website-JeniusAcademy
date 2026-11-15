"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { usePathname } from "@/i18n/navigation";
import { whatsappLink } from "@/lib/contact";
import { routes } from "@/lib/routes";

/** Tombol WhatsApp mengambang. Tampil hanya jika siteConfig.contact.whatsapp diisi; disembunyikan di CMS. */
export function WhatsAppButton() {
  const t = useTranslations("whatsapp");
  const pathname = usePathname();
  const href = whatsappLink(t("message"));
  if (!siteConfig.features.whatsappButton || !href || pathname.startsWith(routes.admin)) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("label")}
      title={t("label")}
      className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-glow transition hover:scale-105 focus-visible:scale-105 print:hidden"
    >
      <Icon name="whatsapp" size={28} />
    </a>
  );
}
