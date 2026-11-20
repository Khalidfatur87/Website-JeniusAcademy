"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { User } from "@/lib/auth";
import { currentSubscription, disablePush, enablePush, pushSupported, VAPID_PUBLIC_KEY, type PushError } from "@/lib/push-client";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Profil: pasang sebagai aplikasi & pengingat belajar harian (notifikasi push). */
export function AppSettings({ user }: { user: User }) {
  const t = useTranslations("pwa");
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [push, setPush] = useState<boolean | null>(null);
  const [error, setError] = useState<PushError | null>(null);
  const [busy, setBusy] = useState(false);
  const canPush = Boolean(VAPID_PUBLIC_KEY);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    let alive = true;
    if (window.matchMedia("(display-mode: standalone)").matches) queueMicrotask(() => alive && setInstalled(true));
    if (canPush && pushSupported()) currentSubscription().then((s) => alive && setPush(Boolean(s)));
    return () => {
      alive = false;
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [canPush]);

  const toggle = async () => {
    setBusy(true);
    setError(null);
    if (push) {
      await disablePush();
      setPush(false);
    } else {
      const e = await enablePush(user.id);
      if (e) setError(e);
      else setPush(true);
    }
    setBusy(false);
  };

  return (
    <section aria-labelledby="app-heading" className="card space-y-4 p-6">
      <h2 id="app-heading" className="text-lg">
        {t("title")}
      </h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted">{installed ? t("installed") : install ? t("installHint") : t("installManual")}</p>
        {install && !installed && (
          <button
            type="button"
            onClick={() => void install.prompt().then(() => setInstall(null))}
            className="btn btn-primary"
          >
            <Icon name="download" size={16} />
            {t("install")}
          </button>
        )}
      </div>
      {canPush && (
        <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-medium">{t("reminder")}</p>
            <p className="text-sm text-muted">{t("reminderHint")}</p>
            {error && (
              <p role="alert" className="mt-1 text-sm text-danger">
                {t(`errors.${error}`)}
              </p>
            )}
          </div>
          <button type="button" onClick={() => void toggle()} disabled={busy || push === null && pushSupported()} aria-pressed={Boolean(push)} className={push ? "btn btn-ghost" : "btn btn-primary"}>
            {push ? t("turnOff") : t("turnOn")}
          </button>
        </div>
      )}
    </section>
  );
}
