import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

/** Layout dua panel untuk login/registrasi: panel brand + kartu form. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const t = useTranslations("auth");

  return (
    <div className="container-page grid min-h-[calc(100dvh-4rem)] items-center gap-10 py-10 lg:grid-cols-2 lg:gap-16">
      <aside
        className="perspective relative hidden overflow-hidden rounded-3xl bg-brand-strong p-10 text-on-brand lg:block"
        
      >
        <div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-10 size-72 rounded-full bg-accent/30 blur-2xl" />

        <div className="relative">
          <span className="text-white">
            <Logo onDark />
          </span>
          <h2 className="mt-16 text-4xl">{t("panelTitle")}</h2>
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-white/85">
            {t("panelQuote")}
          </p>

          {/* Kartu melayang bertumpuk (CSS 3D) */}
          <div
            className="relative mt-12 h-44"
            style={{ transformStyle: "preserve-3d" }}
            aria-hidden="true"
          >
            <div className="absolute left-0 top-6 h-32 w-56 -rotate-6 rounded-2xl bg-white/15 shadow-card backdrop-blur [transform:rotateY(-14deg)_rotateX(8deg)]" />
            <div className="absolute left-16 top-0 grid h-32 w-56 place-items-center rounded-2xl bg-white shadow-card [transform:rotateY(-14deg)_rotateX(8deg)_translateZ(30px)]">
              <Icon name="book" size={44} className="text-brand-strong" />
            </div>
          </div>
        </div>
      </aside>

      <section className="mx-auto w-full max-w-md">
        <div className="card p-7 sm:p-9">
          <h1 className="text-3xl">{title}</h1>
          <p className="mb-7 mt-2 text-muted">{subtitle}</p>
          {children}
        </div>
      </section>
    </div>
  );
}
