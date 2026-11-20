"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { createParentCode, getMyParents, unlinkParent } from "@/lib/engagement-client";
import { formatDate } from "@/lib/format";

/** Di profil siswa: buat kode untuk orang tua dan lihat/lepaskan orang tua yang tertaut. */
export function ParentLinkSection() {
  const t = useTranslations("parent");
  const locale = useLocale();
  const { user } = useAuth();
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [parents, setParents] = useState<{ parentId: string; name: string; linkedAt: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    getMyParents().then((p) => alive && setParents(p));
    return () => {
      alive = false;
    };
  }, [user]);

  if (!user) return null;

  const unlink = async (parentId: string, name: string) => {
    if (!window.confirm(t("confirmUnlinkParent", { name }))) return;
    if (await unlinkParent(parentId, user.id)) setParents((p) => p.filter((x) => x.parentId !== parentId));
  };

  return (
    <section aria-labelledby="parent-link-heading" className="card space-y-4 p-6">
      <h2 id="parent-link-heading" className="text-lg">
        {t("profileTitle")}
      </h2>
      <p className="text-sm text-muted">{t("profileHint")}</p>
      {code ? (
        <div className="rounded-xl bg-surface-2 p-4">
          <p className="font-mono text-2xl font-bold tracking-[0.3em]">{code.code}</p>
          <p className="mt-1 text-xs text-muted">{t("codeExpires", { date: formatDate(code.expiresAt, locale) })}</p>
        </div>
      ) : (
        <button type="button" onClick={() => void createParentCode().then(setCode)} className="btn btn-ghost">
          {t("createCode")}
        </button>
      )}
      {parents.length > 0 && (
        <ul className="divide-y divide-line">
          {parents.map((p) => (
            <li key={p.parentId} className="flex items-center gap-3 py-2 text-sm">
              <span className="flex-1">
                {p.name} <span className="text-xs text-muted">· {formatDate(p.linkedAt, locale)}</span>
              </span>
              <button type="button" onClick={() => void unlink(p.parentId, p.name)} className="text-xs font-semibold text-muted hover:text-danger">
                {t("unlink")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
