"use client";
import Sidebar from "@/components/Sidebar";

export default function BusinessSettings() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Business Details</h1>
        <p>Coming soon…</p>
      </main>
    </div>
  );
}