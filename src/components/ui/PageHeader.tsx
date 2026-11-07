import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-surface-2">
      <div className="grid-dots absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <div className="container-page py-12 sm:py-16">
        <h1 className="text-[clamp(2rem,5vw,3.2rem)]">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-lg text-muted">{subtitle}</p>}
        {children}
      </div>
    </header>
  );
}
