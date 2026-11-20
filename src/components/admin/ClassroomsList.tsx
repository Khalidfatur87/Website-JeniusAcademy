"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, type FormEvent } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { createClassroom } from "@/lib/cms/actions";
import type { AdminClassroom } from "@/lib/cms/queries";
import { routes } from "@/lib/routes";
import { SaveStatus, type Status } from "./fields";

export function ClassroomsList({ classrooms }: { classrooms: AdminClassroom[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [pending, start] = useTransition();

  const create = (e: FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    start(async () => {
      const result = await createClassroom(name);
      setStatus(result);
      if (result.ok) {
        setName("");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="new-class" className="mb-1.5 block text-sm font-medium">
            {t("classrooms.name")}
          </label>
          <input id="new-class" className="field" maxLength={80} placeholder={t("classrooms.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button type="submit" disabled={pending || !name.trim()} className="btn btn-primary">
          + {t("classrooms.create")}
        </button>
        <SaveStatus status={status} />
      </form>
      {classrooms.length === 0 ? (
        <p className="card p-8 text-center text-muted">{t("classrooms.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {classrooms.map((c) => (
            <li key={c.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">
                  {c.name}
                  {c.archived && <span className="ml-2 text-xs font-normal text-muted">({t("classrooms.archived")})</span>}
                </p>
                <p className="text-sm text-muted">
                  {t("classrooms.code")}: <span className="font-mono font-semibold tracking-wider">{c.joinCode}</span> ·{" "}
                  {t("classrooms.members", { count: c.members })}
                </p>
              </div>
              <Link href={routes.adminClassroom(c.id)} className="btn btn-primary">
                {t("classrooms.open")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
