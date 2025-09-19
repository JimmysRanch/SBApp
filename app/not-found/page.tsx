export const runtime = "nodejs";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="relative max-w-xl rounded-[2.5rem] border border-slate-200 bg-white/80 p-12 text-center text-brand-charcoal shadow-2xl shadow-slate-200/70 backdrop-blur">
        <div className="pointer-events-none absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-primary/20 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Oops</p>
        <h1 className="mt-2 text-4xl font-semibold">We couldn’t find that page</h1>
        <p className="mt-3 text-sm text-slate-500">
          The link you followed may be broken or the page may have been removed. Head back to the dashboard to keep things moving.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:translate-y-[-2px] hover:bg-primary-dark"
        >
          Return to dashboard
        </a>
      </div>
    </main>
  );
}
