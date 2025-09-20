"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type CursorPosition = {
  x: number;
  y: number;
};

type FloatingOrb = {
  id: number;
  size: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
  colors: [string, string];
};

const ORB_COUNT = 7;

const colorPairs: Array<[string, string]> = [
  ["rgba(99,196,255,0.45)", "rgba(28,125,255,0.35)"],
  ["rgba(124,92,255,0.5)", "rgba(88,113,255,0.32)"],
  ["rgba(255,102,196,0.48)", "rgba(255,61,158,0.3)"],
  ["rgba(49,216,175,0.45)", "rgba(67,240,197,0.32)"],
  ["rgba(255,209,102,0.45)", "rgba(255,147,62,0.25)"],
  ["rgba(82,153,255,0.45)", "rgba(47,84,235,0.3)"],
];

function randomFromRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function ImmersiveBackground() {
  const rafRef = useRef<number>();
  const [cursor, setCursor] = useState<CursorPosition>({ x: 50, y: 45 });

  const orbs = useMemo<FloatingOrb[]>(
    () =>
      Array.from({ length: ORB_COUNT }, (_, index) => {
        const pair = colorPairs[index % colorPairs.length];
        return {
          id: index,
          size: randomFromRange(18, 36),
          left: randomFromRange(-10, 90),
          top: randomFromRange(-20, 95),
          duration: randomFromRange(16, 28),
          delay: randomFromRange(-20, 12),
          colors: pair,
        } satisfies FloatingOrb;
      }),
    []
  );

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      const nextPosition: CursorPosition = {
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      };

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        setCursor(nextPosition);
      });
    };

    window.addEventListener("pointermove", handlePointer);

    return () => {
      window.removeEventListener("pointermove", handlePointer);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const glowStyle = {
    background: `radial-gradient(circle at ${cursor.x}% ${cursor.y}%, rgba(255,255,255,0.32), rgba(22,88,214,0.0) 55%)`,
  } satisfies CSSProperties;

  return (
    <div className="immersive-bg" aria-hidden="true">
      <div className="immersive-bg__gradient" style={glowStyle} />
      <div className="immersive-bg__mesh" />
      <div className="immersive-bg__grain" />
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="immersive-bg__orb"
          style={{
            width: `${orb.size}rem`,
            height: `${orb.size}rem`,
            left: `${orb.left}%`,
            top: `${orb.top}%`,
            animationDuration: `${orb.duration}s`,
            animationDelay: `${orb.delay}s`,
            background: `radial-gradient(circle at 30% 30%, ${orb.colors[0]}, ${orb.colors[1]} 65%, transparent 100%)`,
          }}
        />
      ))}
    </div>
  );
}
