"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { FormField, fieldProps } from "@/components/ui/FormField";
import { Icon } from "@/components/ui/Icon";

/** Input kata sandi dengan tombol tampilkan/sembunyikan (opsional). */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  show,
  onToggleShow,
  autoComplete,
  placeholder,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  show: boolean;
  /** Jika diberikan, tombol tampilkan/sembunyikan dirender di sebelah label. */
  onToggleShow?: () => void;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  /** Slot di bawah input (mis. indikator kekuatan). */
  children?: ReactNode;
}) {
  const t = useTranslations("auth");

  const toggle = onToggleShow && (
    <button
      type="button"
      onClick={onToggleShow}
      aria-pressed={show}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
    >
      <Icon name={show ? "eyeOff" : "eye"} size={14} />
      {show ? t("hide") : t("show")}
    </button>
  );

  return (
    <FormField id={id} label={label} error={error} aside={toggle}>
      <input
        {...fieldProps(id, error)}
        type={show ? "text" : "password"}
        className="field"
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {children}
    </FormField>
  );
}
