export const runtime = "nodejs";
export default function StatusPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="rounded-[2rem] border border-slate-200 bg-white/85 px-10 py-8 text-center text-brand-charcoal shadow-xl shadow-slate-200/70 backdrop-blur">
        <h1 className="text-2xl font-semibold">Status</h1>
        <p className="mt-2 text-sm text-slate-500">App shell renders.</p>
      </div>
    </main>
  );
}
