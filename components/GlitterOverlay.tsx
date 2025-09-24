"use client";

import { useEffect } from "react";

const BASE_SPARK = 0.35;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function GlitterOverlay() {
  useEffect(() => {
    const root = document.documentElement;

    let animationFrame = 0;
    let sparklePhase = Math.random() * Math.PI * 2;
    let shimmerPhase = Math.random() * Math.PI * 2;
    let spark = BASE_SPARK;
    let targetSpark = BASE_SPARK;

    const updatePointerPosition = (clientX: number, clientY: number) => {
      const x = clamp(clientX / window.innerWidth, 0, 1);
      const y = clamp(clientY / window.innerHeight, 0, 1);
      root.style.setProperty("--glitter-pointer-x", x.toFixed(3));
      root.style.setProperty("--glitter-pointer-y", y.toFixed(3));
    };

    const handlePointerMove = (event: PointerEvent) => {
      updatePointerPosition(event.clientX, event.clientY);

      const velocity = clamp(
        Math.sqrt(event.movementX ** 2 + event.movementY ** 2) / 18,
        0,
        1
      );
      targetSpark = Math.max(targetSpark, BASE_SPARK + velocity * 0.4);
    };

    const handlePointerDown = () => {
      targetSpark = BASE_SPARK + 0.5;
    };

    const settleIntensity = () => {
      targetSpark = BASE_SPARK;
    };

    const handleScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      root.style.setProperty("--glitter-scroll", progress.toFixed(3));
      const hue = 205 + progress * 50;
      root.style.setProperty("--glitter-hue", hue.toFixed(1));
      targetSpark = Math.max(targetSpark, BASE_SPARK + progress * 0.2);
    };

    const animate = () => {
      sparklePhase += 0.025;
      shimmerPhase += 0.018;

      spark += (targetSpark - spark) * 0.08;
      targetSpark = Math.max(BASE_SPARK, targetSpark - 0.01);

      const shimmer = 0.28 + (Math.sin(shimmerPhase) + 1) * 0.18 + spark * 0.12;
      const twinkle =
        0.24 + (Math.sin(sparklePhase * 1.35) + 1) * 0.18 + spark * 0.18;

      root.style.setProperty("--glitter-spark", spark.toFixed(3));
      root.style.setProperty("--glitter-shimmer", shimmer.toFixed(3));
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

  return null;
}
