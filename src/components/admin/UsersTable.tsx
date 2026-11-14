"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState, useTransition } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { setUserRole } from "@/lib/cms/actions";
import type { AdminUser } from "@/lib/cms/queries";
import type { Role } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { SaveStatus, type Status } from "./fields";

const ROLES: Role[] = ["student", "teacher", "super_admin"];

function RoleSelect({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const t = useTranslations("admin");
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();

  const change = (next: Role) => {
    if (next === role) return;
    if (!window.confirm(t("users.confirmRole", { name: user.name || user.email, role: t(`roles.${next}`) }))) {
      return;
    }
    const prev = role;
    setRole(next);
    setStatus("saving");
    start(async () => {
      const result = await setUserRole(user.id, next);
      setStatus(result);
      if (!result.ok) setRole(prev);
    });
  };

  return (
    <div className="space-y-1">
      <select
        aria-label={t("users.role")}
        className="field py-2"
        value={role}
        disabled={pending || isSelf}
        title={isSelf ? t("users.selfHint") : undefined}
        onChange={(e) => change(e.target.value as Role)}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {t(`roles.${r}`)}
          </option>
        ))}
      </select>
      <SaveStatus status={status} />
    </div>
  );
}

export function UsersTable({ users, selfId }: { users: AdminUser[]; selfId: string }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Role | "all">("all");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (filter === "all" || u.role === filter) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
  }, [users, query, filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <FilterPills
          label={t("users.role")}
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: t("users.all") },
            ...ROLES.map((r) => ({ id: r, label: t(`roles.${r}`) })),
          ]}
        />
        <div className="w-full md:max-w-xs">
          <label htmlFor={searchId} className="sr-only">
            {t("users.search")}
          </label>
          <input
            id={searchId}
            type="search"
            className="field"
            placeholder={t("users.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <p className="text-sm text-muted" role="status">
        {t("users.count", { count: shown.length })}
      </p>

      <ul className="space-y-3">
        {shown.map((u) => (
          <li key={u.id} className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_14rem] sm:items-center">
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {u.name || "—"}
                {u.id === selfId && <span className="ml-2 text-xs font-normal text-muted">({t("users.you")})</span>}
              </p>
              <p className="truncate text-sm text-muted">{u.email}</p>
              <p className="text-xs text-muted">
                {t("users.joined")} {formatDate(u.createdAt, locale)}
              </p>
            </div>
            <RoleSelect user={u} isSelf={u.id === selfId} />
          </li>
        ))}
      </ul>
    </div>
  );
}
