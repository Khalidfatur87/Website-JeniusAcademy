"use client";

import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import { FormField, fieldProps } from "@/components/ui/FormField";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
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
 * Form login / registrasi / lupa kata sandi (PRATINJAU).
 * Belum ada server: tidak ada kata sandi yang disimpan atau dikirim.
 * Validasi ada di lib/validation.ts; field di komponen terpisah.
 */
export function AuthForm({ mode }: { mode: AuthMode }) {
  const t = useTranslations("auth");
  const tf = useTranslations("forgot");
  const router = useRouter();
  const { signIn } = useAuth();
  const uid = useId();

  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [notice, setNotice] = useState("");

  const set = (key: keyof typeof values) => (value: string) =>
    setValues((v) => ({ ...v, [key]: value }));
  // Kunci galat → teks terjemahan.
  const err = (key: keyof AuthErrors) =>
    errors[key] ? t(`errors.${errors[key]}`) : undefined;

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const found = validateAuth(mode, values);
    setErrors(found);
    setNotice("");
    if (Object.keys(found).length) return;

    if (mode === "forgot") return setNotice(tf("sent"));

    const email = values.email.trim();
    signIn({ name: values.name.trim() || email.split("@")[0], email });
    router.push(routes.courses);
  };

  const id = (k: string) => `${uid}-${k}`;
  const submitLabel = { login: t("login"), register: t("register"), forgot: tf("send") }[mode];

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
          {mode === "register" && <PasswordStrength password={values.password} />}
        </PasswordField>
      )}

      {mode === "register" && (
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

      <button type="submit" className="btn btn-primary btn-lg w-full">
        {submitLabel}
      </button>

      <p role="status" className="text-sm text-success">
        {notice}
      </p>

      {mode === "forgot" ? (
        <p className="text-center text-sm">
          <Link href={routes.login} className={linkClass}>
            {tf("back")}
          </Link>
        </p>
      ) : (
        <>
          <div className="relative text-center text-xs uppercase tracking-wider text-muted">
            <span className="absolute inset-x-0 top-1/2 -z-0 h-px bg-line" aria-hidden="true" />
            <span className="relative bg-surface px-3">{t("or")}</span>
          </div>
          <GoogleButton onClick={() => setNotice(t("googleSoon"))} />

          <p className="text-center text-sm text-muted">
            {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
            <Link href={mode === "login" ? routes.register : routes.login} className={linkClass}>
              {mode === "login" ? t("register") : t("login")}
            </Link>
          </p>
        </>
      )}

      <p className="rounded-xl bg-surface-2 p-3 text-xs text-muted">{t("demoNote")}</p>
    </form>
  );
}
