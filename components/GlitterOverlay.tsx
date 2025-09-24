"use client";

import { useEffect } from "react";

const BASE_INTENSITY = 0.55;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function GlitterOverlay() {
  useEffect(() => {
    const root = document.documentElement;

    let animationFrame = 0;
    let sparklePhase = Math.random() * Math.PI * 2;
    let intensity = BASE_INTENSITY;
    let targetIntensity = BASE_INTENSITY;

    const updatePointerPosition = (clientX: number, clientY: number) => {
      const x = clamp(clientX / window.innerWidth, 0, 1);
      const y = clamp(clientY / window.innerHeight, 0, 1);
      root.style.setProperty("--glitter-x", x.toFixed(3));
      root.style.setProperty("--glitter-y", y.toFixed(3));
    };

    const handlePointerMove = (event: PointerEvent) => {
      updatePointerPosition(event.clientX, event.clientY);

      const velocity = clamp(
        Math.sqrt(event.movementX ** 2 + event.movementY ** 2) / 18,
        0,
        1
      );
      targetIntensity = Math.max(
        targetIntensity,
        BASE_INTENSITY + 0.1 + velocity * 0.35
      );
    };

    const handlePointerDown = () => {
      targetIntensity = BASE_INTENSITY + 0.35;
    };

    const settleIntensity = () => {
      targetIntensity = BASE_INTENSITY;
    };

    const handleScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      root.style.setProperty("--glitter-scroll", progress.toFixed(3));
      const hue = 210 + progress * 40;
      root.style.setProperty("--glitter-hue", hue.toFixed(1));
      targetIntensity = Math.max(
        targetIntensity,
        BASE_INTENSITY + progress * 0.3
      );
    };

    const animate = () => {
      sparklePhase += 0.02;
      intensity += (targetIntensity - intensity) * 0.04;

      const twinkle = 0.3 + (Math.sin(sparklePhase) + 1) * 0.35 + intensity * 0.25;

      root.style.setProperty("--glitter-intensity", intensity.toFixed(3));
      root.style.setProperty("--glitter-twinkle", twinkle.toFixed(3));

      animationFrame = window.requestAnimationFrame(animate);
    };

    const handleResize = () => {
      updatePointerPosition(window.innerWidth / 2, window.innerHeight / 2);
    };

    updatePointerPosition(window.innerWidth / 2, window.innerHeight / 2);
    handleScroll();
    animationFrame = window.requestAnimationFrame(animate);

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", settleIntensity);
    window.addEventListener("pointerleave", settleIntensity);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", settleIntensity);
      window.removeEventListener("pointerleave", settleIntensity);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden mix-blend-screen">
      <div className="glitter-layer glitter-layer--base" aria-hidden />
      <div className="glitter-layer glitter-layer--sparkle" aria-hidden />
      <div className="glitter-layer glitter-layer--twinkle" aria-hidden />
    </div>
  );
}
