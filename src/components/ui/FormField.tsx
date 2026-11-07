import type { ReactNode } from "react";

/**
 * Atribut aksesibilitas untuk input yang memakai <FormField>:
 * `<input {...fieldProps(id, error)} />`.
 */
export function fieldProps(id: string, error?: string) {
  return {
    id,
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}

/** Label + kontrol + pesan error inline. `id` harus sama dengan id input. */
export function FormField({
  id,
  label,
  error,
  aside,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  /** Elemen kecil di kanan label (mis. tombol tampilkan kata sandi). */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
