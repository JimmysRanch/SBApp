'use client';

import { useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LoginForm() {
  const params = useSearchParams();

  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const celebrationAudioRef = useRef<AudioContext | null>(null);

  const playCelebrationSound = async () => {
    try {
      if (typeof window === 'undefined') return;

      type WindowWithWebkitAudio = Window & {
        webkitAudioContext?: typeof AudioContext;
      };

      const AudioContextClass =
        window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;

      if (!AudioContextClass) return;

      if (!celebrationAudioRef.current) {
        celebrationAudioRef.current = new AudioContextClass();
      }

      const audioContext = celebrationAudioRef.current;
      if (!audioContext) return;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const now = audioContext.currentTime;
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.75, now + 0.05);
      masterGain.gain.linearRampToValueAtTime(0.45, now + 0.25);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
      masterGain.connect(audioContext.destination);

      const playTone = (
        frequency: number,
        delay: number,
        duration: number,
        type: OscillatorType = 'sine',
      ) => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now + delay);

        const gain = audioContext.createGain();
        const startTime = now + delay;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(1, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.connect(gain);
        gain.connect(masterGain);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.3);
      };

      const flourish: Array<[number, number, number, OscillatorType?]> = [
        [523.25, 0, 1.4, 'triangle'],
        [659.25, 0.06, 1.35, 'triangle'],
        [783.99, 0.12, 1.3, 'triangle'],
        [1046.5, 0.42, 1.1, 'triangle'],
      ];

      flourish.forEach(([freq, delay, duration, type]) => playTone(freq, delay, duration, type));

      playTone(392, 0.18, 1.3, 'sine');
      playTone(1567.98, 0.24, 1.2, 'sine');

      window.setTimeout(() => {
        masterGain.disconnect();
      }, 1900);
    } catch {
      // Ignore playback failures (e.g., browser autoplay restrictions).
    }
  };

  const launchConfetti = async () => {
    const { default: confetti } = await import('canvas-confetti');

    const defaults = {
      startVelocity: 65,
      spread: 360,
      ticks: 160,
      gravity: 0.9,
      decay: 0.92,
      zIndex: 2000,
      colors: ['#f472b6', '#38bdf8', '#facc15', '#34d399', '#a855f7', '#f97316', '#fbbf24'],
    } as const;

    type ConfettiOptions = NonNullable<Parameters<typeof confetti>[0]>;

    const fire = (particleCount: number, options: ConfettiOptions = {}) =>
      confetti({ ...defaults, particleCount, ...options });

    fire(420, { scalar: 1.6, startVelocity: 85, origin: { x: 0.5, y: 0.45 } });
    fire(260, { angle: 60, spread: 70, startVelocity: 75, scalar: 1.3, origin: { x: 0, y: 0.8 } });
    fire(260, { angle: 120, spread: 70, startVelocity: 75, scalar: 1.3, origin: { x: 1, y: 0.8 } });

    await new Promise<void>((resolve) => {
      const duration = 3200;
      const animationEnd = Date.now() + duration;

      const interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        const progress = Math.max(0, 1 - timeLeft / duration);

        fire(180 + Math.round(120 * progress), {
          startVelocity: 60,
          scalar: 1.2 + progress * 0.3,
          ticks: 140,
          origin: { x: Math.random() * 0.6 + 0.2, y: 0.1 + Math.random() * 0.3 },
        });

        fire(160, {
          angle: 60,
          spread: 90,
          startVelocity: 55,
          origin: { x: Math.random() * 0.15, y: 0.85 + Math.random() * 0.05 },
        });

        fire(160, {
          angle: 120,
          spread: 90,
          startVelocity: 55,
          origin: { x: 0.85 + Math.random() * 0.15, y: 0.85 + Math.random() * 0.05 },
        });

        if (timeLeft <= 0) {
          window.clearInterval(interval);
          fire(520, { scalar: 1.7, startVelocity: 90, ticks: 200, origin: { x: 0.5, y: 0.45 } });
          fire(360, { spread: 120, decay: 0.9, scalar: 1.4, origin: { x: 0.1, y: 0.92 } });
          fire(360, { spread: 120, decay: 0.9, scalar: 1.4, origin: { x: 0.9, y: 0.92 } });
          window.setTimeout(resolve, 700);
        }
      }, 170);
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      void playCelebrationSound().catch(() => undefined);
      await launchConfetti().catch(() => undefined);
      // Use a full page reload so server components can pick up the new session.
      window.location.href = '/';
    } catch (e: any) {
      setErr(e?.message || 'Sign in failed');
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="relative w-full max-w-lg overflow-hidden rounded-[2.8rem] p-[1px] shadow-[0_55px_120px_-65px_rgba(2,6,17,0.95)]"
    >
      <div className="absolute inset-0 rounded-[2.8rem] bg-gradient-to-br from-brand-blue/35 via-transparent to-brand-bubble/25 opacity-90" />
      <div className="relative z-10 space-y-6 rounded-[2.65rem] bg-[rgba(5,12,31,0.88)] px-12 py-14 text-brand-cream">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.48em] text-brand-cream/60">
            Welcome back
          </p>
          <h1 className="font-serif text-3xl font-semibold text-white">
            Scruffy Squad Command
          </h1>
          <p className="text-sm text-brand-cream/70">
            Sign in to orchestrate every groomer, client, and schedule with elegance.
          </p>
        </div>

        {err && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="login-label block text-xs font-semibold uppercase tracking-[0.32em]">
              Email
            </label>
            <input
              className="login-field w-full"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="login-label block text-xs font-semibold uppercase tracking-[0.32em]">
              Password
            </label>
            <input
              className="login-field w-full"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-brand-blue via-brand-mint/80 to-secondary px-6 py-3 text-sm font-semibold uppercase tracking-[0.38em] text-white shadow-[0_25px_45px_-35px_rgba(77,104,255,0.9)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="relative z-10">{loading ? 'Signing in…' : 'Enter'}</span>
          <span className="absolute inset-0 -z-10 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-brand-cream/70">
          <a className="font-semibold text-brand-cream transition-colors hover:text-white" href="/signup">
            Create account
          </a>
          <a className="font-semibold text-brand-cream transition-colors hover:text-white" href="/reset-password">
            Forgot password?
          </a>
        </div>
      </div>
      <div className="pointer-events-none absolute -left-24 top-10 h-48 w-48 rounded-full bg-brand-blue/30 blur-[140px] opacity-60" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-brand-mint/30 blur-[170px] opacity-40" />
    </form>
  );
}
