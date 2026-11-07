"use client";

import clsx from "clsx";
import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * Kartu dengan efek miring 3D mengikuti kursor (CSS perspective).
 * Hanya aktif untuk mouse; sentuhan & preferensi gerak-berkurang
 * tidak terpengaruh (lihat globals.css).
 */
export function TiltCard({
  children,
  className,
  max = 8,
  enabled = true,
}: {
  children: ReactNode;
  className?: string;
  /** Sudut miring maksimum dalam derajat. */
  max?: number;
  enabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `rotateX(${((0.5 - py) * max * 2).toFixed(2)}deg) rotateY(${((px - 0.5) * max * 2).toFixed(2)}deg) translateZ(0)`;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div className={clsx(enabled && "perspective", "h-full")}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={reset}
        className={clsx("relative h-full", enabled && "tilt", className)}
      >
        {children}
        {enabled && <span className="tilt-shine" aria-hidden="true" />}
      </div>
    </div>
  );
}
