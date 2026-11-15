"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useRef, useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Link } from "@/i18n/navigation";
import { useAuth, type User } from "@/lib/auth";
import { tr } from "@/lib/content";
import { formatDate } from "@/lib/format";
import {
  AVATAR_TYPES,
  NAME_MAX,
  removeAvatar,
  updateName,
  updateWeeklyGoal,
  uploadAvatar,
  type ProfileError,
} from "@/lib/profile";
import { routes } from "@/lib/routes";
import { useCertificates } from "@/lib/user-data";

type Msg = { ok: true } | { ok: false; error: ProfileError } | null;

function Status({ msg }: { msg: Msg }) {
  const t = useTranslations("profile");
  if (!msg) return <span role="status" />;
  return msg.ok ? (
    <span role="status" className="text-sm font-medium text-success">
      {t("saved")}
    </span>
  ) : (
    <span role="alert" className="text-sm font-medium text-danger">
      {t(`errors.${msg.error}`)}
    </span>
  );
}

function PhotoSection({ user }: { user: User }) {
  const t = useTranslations("profile");
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    const error = await uploadAvatar(user.id, file);
    setBusy(false);
    setMsg(error ? { ok: false, error } : { ok: true });
    if (input.current) input.current.value = "";
  };

  const remove = async () => {
    setBusy(true);
    const ok = await removeAvatar(user.id);
    setBusy(false);
    setMsg(ok ? { ok: true } : { ok: false, error: "generic" });
  };

  return (
    <section aria-labelledby="photo-heading" className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
      <Avatar name={user.name} src={user.avatarUrl} size="size-24" />
      <div className="space-y-3">
        <h2 id="photo-heading" className="text-lg">
          {t("photo")}
        </h2>
        <p className="text-sm text-muted">{t("photoHint")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={input}
            type="file"
            accept={AVATAR_TYPES.join(",")}
            className="sr-only"
            id="avatar-input"
            onChange={(e) => void pick(e.target.files?.[0])}
            disabled={busy}
          />
          <label htmlFor="avatar-input" className={`btn btn-ghost cursor-pointer ${busy ? "opacity-60" : ""}`}>
            <Icon name="upload" size={16} />
            {user.avatarUrl ? t("changePhoto") : t("uploadPhoto")}
          </label>
          {user.avatarUrl && (
            <button type="button" onClick={() => void remove()} disabled={busy} className="btn btn-ghost">
              {t("removePhoto")}
            </button>
          )}
          <Status msg={msg} />
        </div>
      </div>
    </section>
  );
}

function DetailsSection({ user }: { user: User }) {
  const t = useTranslations("profile");
  const id = useId();
  const [name, setName] = useState(user.name);
  // Ikuti nama tersimpan (mis. setelah profil termuat) tanpa me-remount form,
  // kecuali pengguna sudah mulai mengetik.
  const [synced, setSynced] = useState(user.name);
  if (synced !== user.name) {
    setSynced(user.name);
    if (name === synced) setName(user.name);
  }
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const error = await updateName(user.id, name);
    setBusy(false);
    setMsg(error ? { ok: false, error } : { ok: true });
  };

  return (
    <section aria-labelledby="details-heading" className="card space-y-5 p-6">
      <h2 id="details-heading" className="text-lg">
        {t("details")}
      </h2>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label htmlFor={`${id}-name`} className="mb-1.5 block text-sm font-medium">
            {t("name")}
          </label>
          <input
            id={`${id}-name`}
            className="field"
            value={name}
            maxLength={NAME_MAX}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">{t("nameHint")}</p>
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="mb-1.5 block text-sm font-medium">
            {t("email")}
          </label>
          <input id={`${id}-email`} className="field opacity-70" value={user.email} readOnly />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy || name.trim() === user.name} className="btn btn-primary">
            {t("save")}
          </button>
          <Status msg={msg} />
        </div>
      </form>
    </section>
  );
}

function GoalSection({ user }: { user: User }) {
  const t = useTranslations("profile");
  const id = useId();
  const [goal, setGoal] = useState(user.weeklyGoal);
  const [synced, setSynced] = useState(user.weeklyGoal);
  if (synced !== user.weeklyGoal) {
    setSynced(user.weeklyGoal);
    if (goal === synced) setGoal(user.weeklyGoal);
  }
  const [msg, setMsg] = useState<Msg>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await updateWeeklyGoal(user.id, goal);
    setMsg(ok ? { ok: true } : { ok: false, error: "generic" });
  };

  return (
    <section aria-labelledby="goal-heading" className="card space-y-4 p-6">
      <h2 id="goal-heading" className="text-lg">
        {t("goal")}
      </h2>
      <form onSubmit={save} className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={`${id}-goal`} className="mb-1.5 block text-sm font-medium">
            {t("goalLabel")}
          </label>
          <input
            id={`${id}-goal`}
            type="number"
            min={1}
            max={50}
            className="field w-32"
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {t("save")}
        </button>
        <Status msg={msg} />
      </form>
    </section>
  );
}

function CertificatesSection() {
  const t = useTranslations("profile");
  const locale = useLocale();
  const { value } = useCertificates();

  return (
    <section aria-labelledby="certs-heading" className="card space-y-4 p-6">
      <h2 id="certs-heading" className="text-lg">
        {t("certificates")}
      </h2>
      {value.length === 0 ? (
        <p className="text-sm text-muted">{t("noCertificates")}</p>
      ) : (
        <ul className="divide-y divide-line">
          {value.map((c) => (
            <li key={c.code} className="flex items-center gap-3 py-3">
              <Icon name="award" size={20} className="shrink-0 text-accent" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{tr(c.courseTitle, locale)}</span>
                <span className="block text-xs text-muted">{formatDate(c.issuedAt, locale)}</span>
              </span>
              <Link href={routes.certificate(c.code)} className="text-sm font-semibold text-brand-ink hover:underline">
                {t("view")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Halaman profil: foto, nama, target mingguan, sertifikat, kata sandi. */
export function ProfileView() {
  const t = useTranslations("profile");
  const { user, ready } = useAuth();

  if (!ready) return <div className="container-page section" aria-busy="true" />;
  if (!user) {
    return (
      <div className="container-page section">
        <div className="card space-y-4 p-8 text-center">
          <p className="text-muted">{t("loginRequired")}</p>
          <Link href={routes.login} className="btn btn-primary">
            {t("login")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page section grid max-w-3xl grid-cols-1 gap-6">
      <PhotoSection user={user} />
      <DetailsSection user={user} />
      <GoalSection user={user} />
      <CertificatesSection />
      <section aria-labelledby="security-heading" className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h2 id="security-heading" className="text-lg">
            {t("password")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("passwordHint")}</p>
        </div>
        <Link href={routes.resetPassword} className="btn btn-ghost">
          {t("changePassword")}
        </Link>
      </section>
    </div>
  );
}
