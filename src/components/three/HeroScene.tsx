"use client";

import { Float, MeshDistortMaterial, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";

type Props = { primary: string; accent: string };

/** Tumpukan "buku" + bola cair + cincin: metafora belajar yang ringan. */
function Shapes({ primary, accent }: Props) {
  const group = useRef<Group>(null);
  const ring = useRef<Group>(null);

  useFrame((state, delta) => {
    if (group.current) {
      // Parallax mengikuti kursor, dihaluskan.
      const targetY = state.pointer.x * 0.5;
      const targetX = -state.pointer.y * 0.3;
      group.current.rotation.y += (targetY - group.current.rotation.y) * 0.05;
      group.current.rotation.x += (targetX - group.current.rotation.x) * 0.05;
    }
    if (ring.current) {
      ring.current.rotation.z += delta * 0.4;
      ring.current.rotation.x += delta * 0.15;
    }
  });

  return (
    <group ref={group}>
      {/* Bola cair utama */}
      <Float speed={1.6} rotationIntensity={0.4} floatIntensity={1.2}>
        <mesh position={[0.2, 0.55, 0]}>
          <sphereGeometry args={[1.05, 64, 64]} />
          <MeshDistortMaterial
            color={primary}
            distort={0.32}
            speed={1.8}
            roughness={0.15}
            metalness={0.25}
          />
        </mesh>
      </Float>

      {/* Tumpukan buku */}
      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.8}>
        <group position={[-1.5, -1.1, 0.4]} rotation={[0.1, 0.5, -0.08]}>
          <RoundedBox args={[1.9, 0.32, 1.3]} radius={0.06} position={[0, 0, 0]}>
            <meshStandardMaterial color={accent} roughness={0.4} />
          </RoundedBox>
          <RoundedBox
            args={[1.7, 0.3, 1.2]}
            radius={0.06}
            position={[0.05, 0.31, 0]}
            rotation={[0, 0.12, 0]}
          >
            <meshStandardMaterial color="#8b5cf6" roughness={0.4} />
          </RoundedBox>
          <RoundedBox
            args={[1.5, 0.28, 1.05]}
            radius={0.06}
            position={[-0.05, 0.6, 0]}
            rotation={[0, -0.1, 0]}
          >
            <meshStandardMaterial color="#22c55e" roughness={0.4} />
          </RoundedBox>
        </group>
      </Float>

      {/* Cincin mengorbit */}
      <group ref={ring} position={[0.2, 0.55, 0]}>
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[1.85, 0.035, 16, 120]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
        </mesh>
      </group>

      {/* Bentuk kecil melayang */}
      <Float speed={2.4} rotationIntensity={1.2} floatIntensity={1.6}>
        <mesh position={[2, 1.6, -0.4]}>
          <icosahedronGeometry args={[0.38, 0]} />
          <meshStandardMaterial color="#8b5cf6" flatShading roughness={0.3} />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={1} floatIntensity={1.4}>
        <mesh position={[-2, 1.5, -0.2]}>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color={accent} flatShading roughness={0.3} />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={1} floatIntensity={1.2}>
        <mesh position={[1.9, -1.3, 0.3]}>
          <torusGeometry args={[0.28, 0.1, 16, 40]} />
          <meshStandardMaterial color="#22c55e" roughness={0.35} />
        </mesh>
      </Float>
    </group>
  );
}

export default function HeroScene({ primary, accent }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Hentikan render saat scene keluar dari layar (hemat baterai/GPU).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="size-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.1, 8.4], fov: 42 }}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 5, 5]} intensity={2.2} />
        <directionalLight position={[-4, -2, 3]} intensity={0.8} color="#8bb8ff" />
        <Shapes primary={primary} accent={accent} />
      </Canvas>
    </div>
  );
}
