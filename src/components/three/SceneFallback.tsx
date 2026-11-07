import { Component, type ReactNode } from "react";

/** Fallback statis (tanpa WebGL / gerak berkurang / sedang memuat). */
export function SceneFallback() {
  return (
    <div className="grid size-full place-items-center" aria-hidden="true">
      <div className="relative size-48 sm:size-64">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand to-violet-500 opacity-80 blur-sm" />
        <div className="absolute -bottom-4 -left-6 h-10 w-36 -rotate-6 rounded-xl bg-accent shadow-card" />
        <div className="absolute -right-4 top-2 size-10 rotate-12 rounded-lg bg-violet-500 shadow-card" />
      </div>
    </div>
  );
}

/** Tangkap error WebGL (mis. GPU tidak tersedia) dan tampilkan fallback. */
export class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <SceneFallback /> : this.props.children;
  }
}
