'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * How to use:
 * 1) Drop this file into your Next.js/React app.
 * 2) Add <DashboardDynamicDemo /> to a route/page. Landscape 16:9 recommended.
 * 3) Tailwind optional. If not using Tailwind, the inline <style> covers essentials.
 *
 * Notes:
 * - Liquid warp uses SVG feTurbulence + feDisplacementMap. Drag/swipe to see it.
 * - Smile detection uses the experimental FaceDetector API. If unavailable, click “Fake Smile”.
 * - Parallax uses pointer + device motion. Cards have perspective and overlap.
 * - Paw prints spawn where you tap/click and fade out.
 */

type Tab = "Home" | "Schedule" | "Clients";

export default function DashboardDynamicDemo() {
  // Tabs + liquid swipe state
  const [tab, setTab] = useState<Tab>("Home");
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Displacement intensity 0..1 (mapped to filter scale)
  const dispRef = useRef(0);
  const [disp, setDisp] = useState(0);

  // Parallax layers
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // Smile -> bounce
  const [smiling, setSmiling] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Paw prints
  const [prints, setPrints] = useState<
    { id: number; x: number; y: number; created: number; rot: number; scale: number }[]
  >([]);

  // Track size
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 1280, h: 720 });

  // Device motion for parallax
  useEffect(() => {
    const onMove = (e: PointerEvent | MouseEvent) => {
      const w = window.innerWidth, h = window.innerHeight;
      const x = ("clientX" in e ? e.clientX : 0) / w - 0.5;
      const y = ("clientY" in e ? e.clientY : 0) / h - 0.5;
      setParallax({ x, y });
    };
    const onOrientation = (e: DeviceOrientationEvent) => {
      const beta = (e.beta ?? 0) / 90;   // -180..180
      const gamma = (e.gamma ?? 0) / 90; // -90..90
      setParallax({ x: gamma * 0.3, y: beta * 0.3 });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("deviceorientation", onOrientation);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, []);

  // Resize
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (!rootRef.current) return;
      const r = rootRef.current.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

  // Liquid displacement easing
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      // decay/spring toward target
      const target = isDragging ? Math.min(1, Math.abs(dragX) / Math.max(80, size.w * 0.15)) : 0;
      dispRef.current += (target - dispRef.current) * 0.15;
      setDisp(dispRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dragX, isDragging, size.w]);

  // Drag/swipe handlers
  const startXRef = useRef(0);
  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startXRef.current = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragX(e.clientX - startXRef.current);
  };
  const onPointerUp = () => {
    if (!isDragging) return;
    const threshold = size.w * 0.18;
    let next: Tab = tab;
    if (dragX > threshold) next = prevTab(tab);
    if (dragX < -threshold) next = nextTab(tab);
    setTab(next);
    setIsDragging(false);
    setDragX(0);
  };

  // Camera + FaceDetector
  useEffect(() => {
    let cancel = false;
    const videoElement = videoRef.current;
    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (cancel) return;
        if (videoElement) {
          videoElement.srcObject = stream;
          await videoElement.play();
          setCameraReady(true);
        }
      } catch {
        setCameraReady(false);
      }
    };
    setup();
    return () => {
      cancel = true;
      const stream = (videoElement?.srcObject as MediaStream | null);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    // Experimental FaceDetector API
    // Fall back: every 5s, toggle smile from tap button
    // Here we treat "face present" as "smile" to trigger the bounce.
    // Replace with real ML if you want true smile probability.
    let detector: any = null;
    let raf = 0;
    let active = true;

    const loop = async () => {
      if (!active) return;
      if (cameraReady && "FaceDetector" in window && videoRef.current) {
        try {
          detector = detector || new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
          const canvas = document.createElement("canvas");
          const v = videoRef.current!;
          canvas.width = v.videoWidth || 640;
          canvas.height = v.videoHeight || 480;
          const ctx = canvas.getContext("2d");
          if (ctx && v.videoWidth && v.videoHeight) {
            ctx.drawImage(v, 0, 0);
            const faces = await detector.detect(canvas);
            setSmiling(faces.length > 0); // proxy trigger
          }
        } catch {
          // ignore
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [cameraReady]);

  // Paw prints lifecycle
  useEffect(() => {
    const timer = setInterval(() => {
      const now = performance.now();
      setPrints(prev => prev.filter(p => now - p.created < 1200));
    }, 200);
    return () => clearInterval(timer);
  }, []);

  const onTap = (e: React.MouseEvent) => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPrints(prev => [
      ...prev,
      {
        id: Math.floor(Math.random() * 1e9),
        x,
        y,
        created: performance.now(),
        rot: (Math.random() - 0.5) * 50,
        scale: 0.6 + Math.random() * 0.7,
      },
    ]);
  };

  const tabs: Tab[] = ["Home", "Schedule", "Clients"];

  // Displacement scale mapping (0..1 -> 0..60)
  const dispScale = Math.round(disp * 60);

  // Background parallax transforms
  const layer = (depth: number) => ({
    transform: `translate3d(${(-parallax.x * depth * 30).toFixed(2)}px, ${(-parallax.y * depth * 30).toFixed(2)}px, 0)`,
  });

  const content = useMemo(() => {
    switch (tab) {
      case "Home":
        return <HomeCards smiling={smiling} />;
      case "Schedule":
        return <ScheduleCards smiling={smiling} />;
      case "Clients":
        return <ClientsCards smiling={smiling} />;
    }
  }, [tab, smiling]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-[min(56vw,85vh)] mx-auto overflow-hidden bg-neutral-950 text-white"
      style={{ aspectRatio: "16/9", touchAction: "none", userSelect: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onTap}
    >
      {/* SVG filter defs for liquid warp */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="liquid">
          <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="2" seed="8" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={dispScale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Parallax background layers */}
      <div className="absolute inset-0" style={{ filter: "url(#liquid)" }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={layer(0.1)}>
            <GradientBackdrop />
          </div>
          <div className="absolute inset-0" style={layer(0.3)}>
            <Stars />
          </div>
          <div className="absolute inset-0" style={layer(0.6)}>
            <SoftShapes />
          </div>
        </div>
      </div>

      {/* Paw prints */}
      {prints.map(p => {
        const age = (performance.now() - p.created) / 1200; // 0..1
        const opacity = 1 - age;
        const scale = p.scale * (0.8 + 0.2 * (1 - age));
        return (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: p.x,
              top: p.y,
              transform: `translate(-50%, -50%) rotate(${p.rot}deg) scale(${scale})`,
              opacity,
              pointerEvents: "none",
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))",
            }}
          >
            <PawSVG />
          </div>
        );
      })}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between backdrop-blur-sm">
        <div className="font-semibold tracking-wide">Scruffy Butts • Dynamic Demo</div>
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded-md transition-transform ${smiling ? "animate-bounce-quick scale-110" : "scale-100"} bg-emerald-500/80 hover:bg-emerald-500`}
            title="Triggers when camera sees a face (proxy for smile)."
          >
            Happy Button
          </button>
          <button
            onClick={() => setSmiling(true)}
            onMouseLeave={() => setSmiling(false)}
            className="px-3 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700"
          >
            Fake Smile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-center gap-3">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm backdrop-blur-md border ${
              t === tab ? "bg-white/15 border-white/40" : "bg-black/25 border-white/20 hover:bg-white/10"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Swipe hint */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-xs text-white/70">Drag horizontally to liquid-warp swipe</div>

      {/* Content with depth and overlap */}
      <div
        className="absolute inset-0 px-8 pt-16 pb-20 pointer-events-none"
        style={{ perspective: "1200px" }}
      >
        <div
          className="w-full h-full relative"
          style={{
            transform: `translateX(${dragX * 0.06}px)`,
            transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {content}
        </div>
      </div>

      {/* Hidden video for face proxy */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Minimal CSS for animation if Tailwind not present */}
      <style>{cssFallback}</style>
    </div>
  );
}

function prevTab(t: Tab): Tab {
  if (t === "Home") return "Clients";
  if (t === "Schedule") return "Home";
  return "Schedule";
}
function nextTab(t: Tab): Tab {
  if (t === "Home") return "Schedule";
  if (t === "Schedule") return "Clients";
  return "Home";
}

/* ---------- Scenes / Layers ---------- */

function GradientBackdrop() {
  return (
    <div
      className="w-full h-full"
      style={{
        background:
          "radial-gradient(1200px 800px at 20% 30%, rgba(56,189,248,0.25), transparent 60%), radial-gradient(1000px 700px at 80% 70%, rgba(34,197,94,0.25), transparent 60%), linear-gradient(160deg, #0b0f12, #0e1116 55%, #111827)",
      }}
    />
  );
}

function Stars() {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 56" preserveAspectRatio="none">
      {Array.from({ length: 120 }).map((_, i) => (
        <circle key={i} cx={Math.random() * 100} cy={Math.random() * 56} r={Math.random() * 0.35 + 0.05} fill="white" opacity="0.35" />
      ))}
    </svg>
  );
}

function SoftShapes() {
  return (
    <div className="w-full h-full relative">
      <div className="absolute w-[40%] h-[50%] left-[10%] top-[25%] rounded-[40%] blur-3xl opacity-30"
        style={{ background: "conic-gradient(from 0deg, #22c55e, #38bdf8, #22c55e)" }} />
      <div className="absolute w-[35%] h-[45%] right-[12%] top-[20%] rounded-[40%] blur-3xl opacity-25"
        style={{ background: "conic-gradient(from 180deg, #38bdf8, #22c55e, #38bdf8)" }} />
    </div>
  );
}

/* ---------- Content Cards with Depth ---------- */

function BaseCard({
  title,
  children,
  z,
  y,
  rot,
  smiling,
}: {
  title: string;
  children: React.ReactNode;
  z: number; // 0..1 depth
  y: number;
  rot?: number;
  smiling: boolean;
}) {
  return (
    <div
      className={`absolute w-[38%] min-w-[380px] max-w-[520px] pointer-events-auto will-change-transform ${
        smiling ? "animate-bounce-subtle" : ""
      }`}
      style={{
        transform: `translate3d(0, ${y}px, ${z * -180}px) rotateX(${rot ?? -3}deg) rotateY(${(z - 0.5) * 6}deg)`,
        transition: "transform 600ms cubic-bezier(0.22,1,0.36,1)",
        transformStyle: "preserve-3d",
        right: z > 0.5 ? "6%" : "auto",
        left: z <= 0.5 ? "6%" : "auto",
      }}
    >
      <div className="rounded-2xl p-4 border border-white/15 bg-white/6 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        <div className="text-sm text-white/70">{title}</div>
        <div className="mt-2 text-white">{children}</div>
      </div>
    </div>
  );
}

function HomeCards({ smiling }: { smiling: boolean }) {
  return (
    <>
      <BaseCard title="Today’s Appointments" z={0.2} y={40} smiling={smiling}>
        <ul className="space-y-1 text-sm">
          <li>08:30 • Max (Golden) • Full Groom</li>
          <li>10:15 • Luna (Husky) • Deshed</li>
          <li>13:00 • Bella (Poodle) • Trim & Bows</li>
        </ul>
      </BaseCard>
      <BaseCard title="Revenue Snapshot" z={0.5} y={140} smiling={smiling} rot={-5}>
        <div className="text-2xl font-semibold">$1,420</div>
        <div className="text-xs text-white/60">+12% vs yesterday</div>
      </BaseCard>
      <BaseCard title="Messages" z={0.8} y={260} smiling={smiling} rot={-2}>
        <ul className="space-y-1 text-sm">
          <li>Anna • “Can I add nail trim?”</li>
          <li>Rob • “Running 10 mins late.”</li>
          <li>Mia • “Same cut as last time.”</li>
        </ul>
      </BaseCard>
    </>
  );
}

function ScheduleCards({ smiling }: { smiling: boolean }) {
  return (
    <>
      <BaseCard title="Groomer Workload" z={0.25} y={60} smiling={smiling}>
        <div className="text-sm">Alex: 6 • Richele: 5 • Jamie: 4</div>
      </BaseCard>
      <BaseCard title="Open Slots" z={0.6} y={200} smiling={smiling}>
        <div className="text-sm">2:30 PM • 3:15 PM • 4:45 PM</div>
      </BaseCard>
      <BaseCard title="Pickup Queue" z={0.85} y={320} smiling={smiling}>
        <div className="text-sm">Max 2:10 • Luna 3:00 • Bella 4:20</div>
      </BaseCard>
    </>
  );
}

function ClientsCards({ smiling }: { smiling: boolean }) {
  return (
    <>
      <BaseCard title="Top Clients" z={0.2} y={70} smiling={smiling}>
        <div className="text-sm">Anna W • $2,340 • 18 visits</div>
        <div className="text-sm">Rob T • $1,980 • 15 visits</div>
      </BaseCard>
      <BaseCard title="Recent" z={0.55} y={210} smiling={smiling}>
        <div className="text-sm">Mia • Poodle • Bow add-on</div>
        <div className="text-sm">Zoe • Corgi • De-shed</div>
      </BaseCard>
      <BaseCard title="Notes" z={0.85} y={330} smiling={smiling}>
        <div className="text-sm">Max dislikes dryers. Start low, towel first.</div>
      </BaseCard>
    </>
  );
}

/* ---------- SVG Paw ---------- */

function PawSVG() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="currentColor">
      <g opacity="0.95">
        <circle cx="20" cy="22" r="6" />
        <circle cx="32" cy="18" r="6" />
        <circle cx="44" cy="22" r="6" />
        <path d="M32 28c-10 0-18 6-18 12 0 6 8 10 18 10s18-4 18-10c0-6-8-12-18-12z" />
      </g>
    </svg>
  );
}

/* ---------- Minimal CSS (fallback if no Tailwind) ---------- */

const cssFallback = `
.bg-white\/6 { background: rgba(255,255,255,0.06); }
.border-white\/15 { border-color: rgba(255,255,255,0.15); }
.border-white\/20 { border-color: rgba(255,255,255,0.20); }
.border-white\/40 { border-color: rgba(255,255,255,0.40); }
.bg-neutral-950 { background: #0a0a0a; }
.bg-neutral-800 { background: #262626; }
.text-white { color: #fff; }
.text-white\/70 { color: rgba(255,255,255,0.7); }
.text-white\/60 { color: rgba(255,255,255,0.6); }
.backdrop-blur-sm { backdrop-filter: blur(8px); }
.rounded-2xl { border-radius: 1rem; }
.shadow-\[0_10px_40px_rgba\(0,0,0,0\.35\)\] { box-shadow: 0 10px 40px rgba(0,0,0,0.35); }
.p-4 { padding: 1rem; } .p-3 { padding: .75rem; } .p-2 { padding: .5rem; }
.px-3 { padding-left:.75rem; padding-right:.75rem; }
.py-1 { padding-top:.25rem; padding-bottom:.25rem; }
.px-4 { padding-left:1rem; padding-right:1rem; } .py-2 { padding-top:.5rem; padding-bottom:.5rem; }
.mt-2{margin-top:.5rem;} .pt-16{padding-top:4rem;} .pb-20{padding-bottom:5rem;} .px-8{padding-left:2rem; padding-right:2rem;}
.mr-2{margin-right:.5rem;}
.rounded-md{border-radius:.375rem;} .rounded-full{border-radius:9999px;}
.text-sm{font-size:.875rem;} .text-xs{font-size:.75rem;} .text-2xl{font-size:1.5rem;} .font-semibold{font-weight:600;}
.w-full{width:100%;} .h-full{height:100%;} .inset-0{top:0;left:0;right:0;bottom:0;} .absolute{position:absolute;} .relative{position:relative;}
.flex{display:flex;} .items-center{align-items:center;} .justify-between{justify-content:space-between;} .justify-center{justify-content:center;}
.gap-2{gap:.5rem;} .gap-3{gap:.75rem;}
.backdrop-blur-md{backdrop-filter: blur(16px);}
.hover\:bg-white\/10:hover{background: rgba(255,255,255,0.10);}
.hover\:bg-neutral-700:hover{background:#3f3f46;}
.bg-white\/15 { background: rgba(255,255,255,0.15); }
.bg-black\/25 { background: rgba(0,0,0,0.25); }
.bg-emerald-500 { background:#10b981; }
.bg-emerald-500\/80 { background: rgba(16,185,129,0.8); }
.hover\:bg-emerald-500:hover { background:#10b981; }
.border { border-width:1px; }
.pointer-events-none{pointer-events:none;} .pointer-events-auto{pointer-events:auto;}
.animate-bounce-subtle { animation: bounceSubtle 900ms cubic-bezier(.22,1,.36,1); }
@keyframes bounceSubtle {
  0% { transform: translate3d(0,0,0) scale(1); }
  30% { transform: translate3d(0,-6px,0) scale(1.05); }
  60% { transform: translate3d(0,2px,0) scale(0.98); }
  100% { transform: translate3d(0,0,0) scale(1); }
}
.animate-bounce-quick { animation: bounceQuick 600ms cubic-bezier(.22,1,.36,1); }
@keyframes bounceQuick {
  0% { transform: scale(1); }
  35% { transform: scale(1.12); }
  60% { transform: scale(0.96); }
  100% { transform: scale(1); }
}
` as const;

