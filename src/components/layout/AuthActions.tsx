"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth, type User } from "@/lib/auth";
import { useEscape } from "@/lib/hooks";
import { routes } from "@/lib/routes";
import { Icon } from "@/components/ui/Icon";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const isStaff = (user: User) => user.role === "teacher" || user.role === "super_admin";

function Avatar({ name, size = "size-8" }: { name: string; size?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "grid shrink-0 place-items-center rounded-full bg-brand-strong text-xs font-bold text-on-brand",
        size,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Nama, email, dan role — kepala menu akun. */
function UserSummary({ user }: { user: User }) {
  const roles = useTranslations("admin.roles");
  return (
    <div className="flex items-center gap-3">
      <Avatar name={user.name} size="size-10" />
      <div className="min-w-0">
        <p className="truncate font-semibold">{user.name}</p>
        <p className="truncate text-xs text-muted">{user.email}</p>
        {user.role !== "student" && (
          <span className="mt-1 inline-block rounded-full bg-brand/10 px-2 py-0.5 text-[0.7rem] font-semibold text-brand-ink">
            {roles(user.role)}
          </span>
        )}
      </div>
    </div>
  );
}

/** Item menu akun (tautan atau tombol) dengan gaya seragam. */
function MenuItem({
  href,
  onClick,
  icon,
  children,
  active,
  danger,
}: {
  href?: string;
  onClick?: () => void;
  icon: "user" | "book" | "logout";
  children: ReactNode;
  active?: boolean;
  danger?: boolean;
}) {
  const className = clsx(
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
    active ? "bg-brand/10 text-brand-ink" : danger ? "text-danger hover:bg-danger/10" : "hover:bg-surface-2",
  );
  const content = (
    <>
      <Icon name={icon} size={18} className={active || danger ? "" : "text-muted"} />
      {children}
    </>
  );
  return href ? (
    <Link href={href} className={className} aria-current={active ? "page" : undefined}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

/** Daftar menu akun: Dasbor, CMS (guru/super admin), Keluar. */
function AccountLinks({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      <li>
        <MenuItem href={routes.dashboard} icon="user" active={pathname.startsWith(routes.dashboard)}>
          {t("dashboard")}
        </MenuItem>
      </li>
      {isStaff(user) && (
        <li>
          <MenuItem href={routes.admin} icon="book" active={pathname.startsWith(routes.admin)}>
            {t("cms")}
          </MenuItem>
        </li>
      )}
      <li className="mt-1 border-t border-line pt-1">
        <MenuItem onClick={onSignOut} icon="logout" danger>
          {t("logout")}
        </MenuItem>
      </li>
    </ul>
  );
}

/** Desktop: satu tombol akun yang membuka menu dropdown. */
function AccountMenu({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const menuId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // Tutup saat pindah halaman.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEscape(open, () => setOpen(false));

  // Tutup saat klik di luar menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const firstName = user.name.split(" ")[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("account")}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex h-10 items-center gap-2 rounded-xl border bg-surface pl-1.5 pr-2.5 text-sm font-semibold transition",
          open ? "border-brand" : "border-line hover:border-brand",
        )}
      >
        <Avatar name={user.name} size="size-7" />
        <span className="max-w-[8rem] truncate">{firstName}</span>
        <Icon name="chevronDown" size={16} className={clsx("text-muted transition", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id={menuId}
          className="card absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 p-3 shadow-glow"
        >
          <div className="border-b border-line px-1 pb-3">
            <UserSummary user={user} />
          </div>
          <div className="pt-2">
            <AccountLinks user={user} onSignOut={onSignOut} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Tombol masuk/daftar, atau menu akun jika sudah login. */
export function AuthActions({ variant }: { variant: "desktop" | "mobile" }) {
  const t = useTranslations("nav");
  const { user, signOut } = useAuth();
  const onSignOut = () => void signOut();

  if (user) {
    return variant === "desktop" ? (
      <AccountMenu user={user} onSignOut={onSignOut} />
    ) : (
      <div className="rounded-2xl border border-line bg-surface p-3">
        <div className="px-1 pb-3">
          <UserSummary user={user} />
        </div>
        <AccountLinks user={user} onSignOut={onSignOut} />
      </div>
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
