"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "@/lib/hooks";
import { SceneBoundary, SceneFallback } from "@/components/three/SceneFallback";

// Three.js hanya dimuat di client dan terpisah dari bundle awal.
const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => <SceneFallback />,
});

export function Hero3D({
  primary,
  accent,
  label,
}: {
  primary: string;
  accent: string;
  label: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div role="img" aria-label={label} className="size-full">
      {reduced ? (
        <SceneFallback />
      ) : (
        <SceneBoundary>
          <HeroScene primary={primary} accent={accent} />
        </SceneBoundary>
      )}
    </div>
  );
}
