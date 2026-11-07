import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";

type Item = {
  key: "email" | "phone" | "whatsapp" | "address";
  icon: IconName;
  text: string;
  href?: string;
};

/** Kartu kontak dibangun dari siteConfig.contact; nilai kosong disembunyikan. */
function contactItems(): Item[] {
  const { email, phone, whatsapp, address } = siteConfig.contact;
  const items: (Item | false)[] = [
    !!email && { key: "email", icon: "mail", text: email, href: `mailto:${email}` },
    !!phone && { key: "phone", icon: "phone", text: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    !!whatsapp && { key: "whatsapp", icon: "message", text: `+${whatsapp}`, href: `https://wa.me/${whatsapp}` },
    !!address && { key: "address", icon: "pin", text: address },
  ];
  return items.filter((i): i is Item => !!i);
}

export function ContactSection() {
  const t = useTranslations("contact");
  const items = contactItems();

  return (
    <section id="contact" className="section scroll-mt-20 bg-surface-2">
      <div className="container-page max-w-3xl text-center">
        <SectionHeading wide title={t("title")} subtitle={t("subtitle")} />

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {items.map(({ key, icon, text, href }) => (
            <li key={key} className="card flex items-center gap-4 p-5 text-left">
              <Icon name={icon} className="shrink-0 text-brand-ink" />
              <div className="min-w-0">
                <p className="text-xs text-muted">{t(key)}</p>
                {href ? (
                  <a
                    href={href}
                    {...(href.startsWith("http") && {
                      target: "_blank",
                      rel: "noopener noreferrer",
                    })}
                    className="block truncate font-semibold hover:text-brand-ink"
                  >
                    {text}
                  </a>
                ) : (
                  <p className="font-semibold">{text}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
