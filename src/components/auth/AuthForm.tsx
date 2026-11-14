"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import { FormField, fieldProps } from "@/components/ui/FormField";
import { siteConfig } from "@/config/site";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth, type AuthFailure } from "@/lib/auth";
import { routes } from "@/lib/routes";
import {
  validateAuth,
  type AuthErrors,
  type AuthMode,
} from "@/lib/validation";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrength } from "@/components/auth/PasswordStrength";

const linkClass = "font-semibold text-brand-ink hover:underline";

/**
 * Form login / registrasi / lupa & atur ulang kata sandi (Supabase Auth).
 * Validasi ada di lib/validation.ts; panggilan server di lib/auth.ts.
 */
export function AuthForm({ mode }: { mode: AuthMode }) {
  const t = useTranslations("auth");
  const tf = useTranslations("forgot");
  const locale = useLocale();
  const router = useRouter();
  const auth = useAuth();
  const uid = useId();

  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof values) => (value: string) =>
    setValues((v) => ({ ...v, [key]: value }));
  // Kunci galat → teks terjemahan.
  const err = (key: keyof AuthErrors) =>
    errors[key] ? t(`errors.${errors[key]}`) : undefined;

  const creating = mode === "register" || mode === "reset";

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (busy) return;
    const found = validateAuth(mode, values);
    setErrors(found);
    setNotice("");
    setFailure(null);
    if (Object.keys(found).length) return;

    const email = values.email.trim();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await auth.sendPasswordReset(email, locale);
        // Tidak membedakan email terdaftar/tidak (mencegah penelusuran akun).
        return error && error !== "generic"
          ? setFailure(error)
          : setNotice(tf("sent"));
      }

      if (mode === "reset") {
        const { error } = await auth.updatePassword(values.password);
        if (error) return setFailure(error);
        setNotice(tf("saved"));
        return router.push(routes.courses);
      }

      if (mode === "register") {
        const name = values.name.trim();
        const res = await auth.signUp({ name, email, password: values.password }, locale);
        if (res.error) return setFailure(res.error);
        if (res.needsConfirmation) return setNotice(t("checkEmail"));
        return router.push(routes.courses);
      }

      const { error } = await auth.signIn({ email, password: values.password });
      if (error) return setFailure(error);
      router.push(routes.courses);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setFailure(null);
    setNotice("");
    const { error } = await auth.signInWithGoogle(locale);
    if (error) setFailure(error);
  };

  const id = (k: string) => `${uid}-${k}`;
  const submitLabel = {
    login: t("login"),
    register: t("register"),
    forgot: tf("send"),
    reset: tf("save"),
  }[mode];

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {mode === "register" && (
        <FormField id={id("name")} label={t("name")} error={err("name")}>
          <input
            {...fieldProps(id("name"), err("name"))}
            className="field"
            autoComplete="name"
            value={values.name}
            placeholder={t("namePlaceholder")}
            onChange={(e) => set("name")(e.target.value)}
          />
        </FormField>
      )}

      {mode !== "reset" && (
        <FormField id={id("email")} label={t("email")} error={err("email")}>
          <input
            {...fieldProps(id("email"), err("email"))}
            type="email"
            className="field"
            autoComplete="email"
            value={values.email}
            placeholder={t("emailPlaceholder")}
            onChange={(e) => set("email")(e.target.value)}
          />
        </FormField>
      )}

      {mode !== "forgot" && (
        <PasswordField
          id={id("pw")}
          label={t("password")}
          value={values.password}
          onChange={set("password")}
          error={err("password")}
          show={showPw}
          onToggleShow={() => setShowPw((v) => !v)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={t("passwordPlaceholder")}
        >
          {creating && <PasswordStrength password={values.password} />}
        </PasswordField>
      )}

      {creating && (
        <PasswordField
          id={id("confirm")}
          label={t("confirmPassword")}
          value={values.confirm}
          onChange={set("confirm")}
          error={err("confirm")}
          show={showPw}
          autoComplete="new-password"
        />
      )}

      {mode === "login" && (
        <div className="text-right">
          <Link href={routes.forgotPassword} className="text-sm font-medium text-brand-ink hover:underline">
            {t("forgot")}
          </Link>
        </div>
      )}

      <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
        {submitLabel}
      </button>

      <p role="status" className="text-sm text-success">
        {notice}
      </p>
      {failure && (
        <p role="alert" className="text-sm text-danger">
          {t(`errors.${failure}`)}
        </p>
      )}

      {mode === "forgot" || mode === "reset" ? (
        <p className="text-center text-sm">
          <Link href={routes.login} className={linkClass}>
            {tf("back")}
          </Link>
        </p>
      ) : (
        <>
          {siteConfig.features.googleLogin && (
            <>
              <div className="relative text-center text-xs uppercase tracking-wider text-muted">
                <span className="absolute inset-x-0 top-1/2 -z-0 h-px bg-line" aria-hidden="true" />
                <span className="relative bg-surface px-3">{t("or")}</span>
              </div>
              <GoogleButton onClick={google} />
            </>
          )}

          <p className="text-center text-sm text-muted">
            {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
            <Link href={mode === "login" ? routes.register : routes.login} className={linkClass}>
              {mode === "login" ? t("register") : t("login")}
            </Link>
          </p>
        </>
      )}
    </form>
  );
}
