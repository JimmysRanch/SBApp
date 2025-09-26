import Link from "next/link";
import { Nunito } from "next/font/google";
import type { Metadata } from "next";

import AuthProvider from "@/components/AuthProvider";
import TopNav from "@/components/TopNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scruffy Butts",
  description: "Grooming dashboard",
  manifest: "/manifest.json",
};
export const runtime = "nodejs";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${nunito.variable} font-sans text-white/90 antialiased bg-gradient-to-br from-brand-blue via-primary to-brand-sky min-h-screen overflow-x-hidden`}
      >
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-brand-bubble/30 blur-[120px]" />
              <div className="absolute -right-24 top-24 h-[28rem] w-[28rem] rounded-full bg-brand-lavender/25 blur-[140px]" />
              <div className="absolute bottom-[-18rem] left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-brand-mint/20 blur-[160px]" />
            </div>
            <header className="sticky top-0 z-40 flex justify-center px-4 pt-6">
              <div className="glass-panel flex w-full max-w-6xl items-center gap-6 px-6 py-4">
                <Link href="/" className="group flex items-center gap-4 text-white">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-2xl shadow-inner ring-4 ring-white/40 transition-transform duration-300 group-hover:-rotate-12">
                    🐾
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Scruffy</span>
                    <span className="text-2xl font-black text-white transition-colors duration-300 group-hover:text-brand-cream">
                      Butts
                    </span>
                  </div>
                </Link>
                <div className="flex flex-1 justify-end">
                  <TopNav />
                </div>
              </div>
            </header>
            <main className="relative z-10 flex-1">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
