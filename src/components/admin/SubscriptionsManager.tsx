"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState, useTransition, type FormEvent } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { useRouter } from "@/i18n/navigation";
import { grantSubscription, revokeSubscription } from "@/lib/cms/actions";
import type { AdminLevel, AdminSubscription } from "@/lib/cms/queries";
import { SUBSCRIPTION_MONTHS } from "@/lib/cms/validate";
import { tr } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { Field, SaveStatus, type Status } from "./fields";

type UserOption = { id: string; name: string; email: string };
type Filter = "active" | "expired" | "all";

const isActive = (s: AdminSubscription) => s.expiresAt === null || new Date(s.expiresAt) > new Date();

function GrantForm({ users, levels }: { users: UserOption[]; levels: AdminLevel[] }) {
  const t = useTranslations("admin.subscriptions");
  const locale = useLocale();
  const router = useRouter();
  const id = useId();
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState("");
  const [levelId, setLevelId] = useState(levels[0]?.id ?? "");
  const [months, setMonths] = useState<string>("1");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      : users;
    return list.slice(0, 50);
  }, [users, query]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    start(async () => {
      const result = await grantSubscription(userId, levelId, months === "forever" ? null : Number(months), note);
      setStatus(result);
      if (result.ok) {
        setNote("");
        router.refresh();
      }
    });
  };

  if (levels.length === 0) return <p className="card p-6 text-sm text-muted">{t("noPaidLevels")}</p>;

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h3 className="text-lg">{t("grantTitle")}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={t("searchUser")} htmlFor={`${id}-q`}>
          <input
            id={`${id}-q`}
            type="search"
            className="field"
            value={query}
            placeholder={t("searchPlaceholder")}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <Field label={t("user")} htmlFor={`${id}-u`}>
          <select id={`${id}-u`} className="field" value={userId} onChange={(e) => setUserId(e.target.value)} required>
            <option value="">{t("chooseUser")}</option>
            {matches.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || "—"} ({u.email})
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("level")} htmlFor={`${id}-l`}>
          <select id={`${id}-l`} className="field" value={levelId} onChange={(e) => setLevelId(e.target.value)}>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {tr(l.name, locale)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("duration")} htmlFor={`${id}-m`} hint={t("durationHint")}>
          <select id={`${id}-m`} className="field" value={months} onChange={(e) => setMonths(e.target.value)}>
            {SUBSCRIPTION_MONTHS.map((m) => (
              <option key={m} value={String(m)}>
                {t("months", { count: m })}
              </option>
            ))}
            <option value="forever">{t("forever")}</option>
          </select>
        </Field>
      </div>
      <Field label={t("note")} htmlFor={`${id}-n`} hint={t("noteHint")}>
        <input
          id={`${id}-n`}
          className="field"
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || !userId} className="btn btn-primary">
          {t("grant")}
        </button>
        <SaveStatus status={status} />
      </div>
    </form>
  );
}

function SubscriptionRow({ sub, levelName }: { sub: AdminSubscription; levelName: string }) {
  const t = useTranslations("admin.subscriptions");
  const locale = useLocale();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();
  const active = isActive(sub);

  const revoke = () => {
    if (!window.confirm(t("confirmRevoke", { name: sub.userName || sub.userEmail, level: levelName }))) return;
    start(async () => {
      const result = await revokeSubscription(sub.userId, sub.levelId);
      setStatus(result);
      if (result.ok) router.refresh();
    });
  };

  return (
    <li className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate font-semibold">{sub.userName || "—"}</p>
        <p className="truncate text-sm text-muted">{sub.userEmail}</p>
        <p className="mt-1 text-sm">
          <span className="font-medium">{levelName}</span>
          {" · "}
          <span className={active ? "text-success" : "text-danger"}>
            {sub.expiresAt === null
              ? t("forever")
              : active
                ? t("until", { date: formatDate(sub.expiresAt, locale) })
                : t("expired", { date: formatDate(sub.expiresAt, locale) })}
          </span>
        </p>
        {sub.note && <p className="mt-1 text-xs text-muted">{sub.note}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={revoke} disabled={pending} className="btn btn-ghost">
          {t("revoke")}
        </button>
        <SaveStatus status={status} />
      </div>
    </li>
  );
}

/** Super admin memberi, memperpanjang, dan mencabut akses jenjang berbayar. */
export function SubscriptionsManager({
  users,
  levels,
  subscriptions,
}: {
  users: UserOption[];
  levels: AdminLevel[];
  subscriptions: AdminSubscription[];
}) {
  const t = useTranslations("admin.subscriptions");
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>("active");
  const levelName = (id: string) => {
    const l = levels.find((x) => x.id === id);
    return l ? tr(l.name, locale) : id;
  };
  const shown = subscriptions.filter((s) =>
    filter === "all" ? true : filter === "active" ? isActive(s) : !isActive(s),
  );

  return (
    <div className="space-y-8">
      <GrantForm users={users} levels={levels} />

      <section aria-labelledby="subs-list" className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 id="subs-list" className="text-lg">
            {t("listTitle")}
          </h3>
          <FilterPills
            label={t("filter")}
            value={filter}
            onChange={setFilter}
            options={[
              { id: "active", label: t("active") },
              { id: "expired", label: t("expiredFilter") },
              { id: "all", label: t("all") },
            ]}
          />
        </div>
        {shown.length === 0 ? (
          <p className="card p-6 text-center text-muted">{t("empty")}</p>
        ) : (
          <ul className="space-y-3">
            {shown.map((s) => (
              <SubscriptionRow key={`${s.userId}-${s.levelId}`} sub={s} levelName={levelName(s.levelId)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
