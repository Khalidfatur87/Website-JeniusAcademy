"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { Link, usePathname } from "@/i18n/navigation";
import { useEscape, useScrolled } from "@/lib/hooks";
import { routes } from "@/lib/routes";
import { AuthActions } from "@/components/layout/AuthActions";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { NavLinkList } from "@/components/layout/NavLinkList";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Navbar({ darkModeEnabled }: { darkModeEnabled: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  // Tutup menu saat pindah halaman (pola "adjust state during render").
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEscape(open, () => setOpen(false));

  const toolbar = (
    <>
      <LocaleSwitcher />
      {darkModeEnabled && <ThemeToggle />}
    </>
  );

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 border-b transition-colors",
        scrolled || open
          ? "border-line bg-page/85 backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href={routes.home} aria-label="Home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label={t("main")} className="hidden lg:block">
          <NavLinkList variant="desktop" />
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">{toolbar}</div>
          <div className="hidden items-center gap-2 lg:flex">
            <AuthActions variant="desktop" />
          </div>

          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl border border-line bg-surface lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "x" : "menu"} />
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="container-page border-t border-line pb-6 pt-3 lg:hidden"
        >
          <NavLinkList variant="mobile" />
          <div className="mt-4 flex items-center gap-2 sm:hidden">{toolbar}</div>
          <div className="mt-4 flex flex-col gap-2">
            <AuthActions variant="mobile" />
          </div>
        </div>
      )}
    </header>
  );
}
