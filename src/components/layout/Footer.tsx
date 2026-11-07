import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

const socialIcons: Record<string, IconName> = {
  instagram: "instagram",
  youtube: "youtube",
  tiktok: "tiktok",
  x: "twitter",
  facebook: "facebook",
};

type NavKey = "courses" | "pricing" | "reviews" | "contact" | "login" | "register";

const columns: { titleKey: "explore" | "account"; links: { href: string; key: NavKey }[] }[] = [
  {
    titleKey: "explore",
    links: [
      { href: routes.courses, key: "courses" },
      { href: routes.pricing, key: "pricing" },
      { href: routes.reviews, key: "reviews" },
      { href: routes.contact, key: "contact" },
    ],
  },
  {
    titleKey: "account",
    links: [
      { href: routes.login, key: "login" },
      { href: routes.register, key: "register" },
    ],
  },
];

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();
  const socials = Object.entries(siteConfig.socials).filter(([, url]) => url);

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-muted">{t("footer.tagline")}</p>
          {socials.length > 0 && (
            <ul className="mt-5 flex gap-2" aria-label={t("footer.social")}>
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="grid size-10 place-items-center rounded-xl border border-line text-muted transition hover:border-brand hover:text-brand-ink"
                  >
                    <Icon name={socialIcons[name] ?? "globe"} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {columns.map(({ titleKey, links }) => (
          <nav key={titleKey} aria-label={t(`footer.${titleKey}`)}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {t(`footer.${titleKey}`)}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {links.map(({ href, key }) => (
                <li key={key}>
                  <Link href={href} className="hover:text-brand-ink">
                    {t(`nav.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line py-5 text-center text-sm text-muted">
        © {year} {siteConfig.name}. {t("footer.rights")}
      </div>
    </footer>
  );
}
