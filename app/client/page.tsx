import Link from "next/link";

export default function ClientHome() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold text-white">Welcome back!</h1>
      <p className="text-sm text-white/80">
        From here you can review your upcoming grooming appointments or update your personal details.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/client/appointments"
          className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 transition hover:border-white/30 hover:bg-white/10"
        >
          <h2 className="text-lg font-semibold text-white">My Appointments</h2>
          <p className="text-sm text-white/70">View upcoming visits and check past services.</p>
        </Link>
        <Link
          href="/client/profile"
          className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 transition hover:border-white/30 hover:bg-white/10"
        >
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <p className="text-sm text-white/70">Keep your contact information current.</p>
        </Link>
      </div>
    </div>
  );
}
