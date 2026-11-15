import { siteConfig } from "@/config/site";
import { routes } from "./routes";

/** Tautan WhatsApp dengan pesan terisi, atau null jika nomor belum diatur. */
export function whatsappLink(text?: string): string | null {
  const num = siteConfig.contact.whatsapp.replace(/\D/g, "");
  if (!num) return null;
  return `https://wa.me/${num}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/**
 * Cara menghubungi admin untuk berlangganan (pembayaran otomatis belum ada):
 * WhatsApp → email → bagian kontak di beranda.
 */
export function subscribeContact(message: string): { href: string; external: boolean } {
  const wa = whatsappLink(message);
  if (wa) return { href: wa, external: true };
  const { email } = siteConfig.contact;
  if (email) {
    return {
      href: `mailto:${email}?subject=${encodeURIComponent(siteConfig.name)}&body=${encodeURIComponent(message)}`,
      external: true,
    };
  }
  return { href: routes.contact, external: false };
}
