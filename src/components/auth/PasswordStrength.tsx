import { useTranslations } from "next-intl";
import { passwordStrength } from "@/lib/validation";

const colors = { 1: "var(--danger)", 2: "var(--accent)", 3: "var(--success)" } as const;
const labelKey = { 1: "strengthWeak", 2: "strengthFair", 3: "strengthStrong" } as const;

/** Meter 3 segmen + label kekuatan kata sandi. Kosong → tidak dirender. */
export function PasswordStrength({ password }: { password: string }) {
  const t = useTranslations("auth");
  const level = passwordStrength(password);
  if (!level) return null;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className="h-1.5 flex-1 rounded-full bg-line"
            style={n <= level ? { background: colors[level] } : undefined}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">
        {t("strength")}: {t(labelKey[level])}
      </p>
    </div>
  );
}
