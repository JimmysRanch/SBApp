import TopNav from "@/components/TopNav";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Nunito } from "next/font/google";

export const metadata = {
  title: "Scruffy Butts",
  description: "Grooming dashboard",
};
export const runtime = "nodejs";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${nunito.variable} font-sans text-white/90 antialiased bg-gradient-to-br from-brand-blue via-primary to-brand-sky min-h-screen overflow-x-hidden`}
      >
        <div className="relative flex min-h-screen flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-brand-bubble/30 blur-[120px]" />
            <div className="absolute -right-24 top-24 h-[28rem] w-[28rem] rounded-full bg-brand-lavender/25 blur-[140px]" />
            <div className="absolute bottom-[-18rem] left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-brand-mint/20 blur-[160px]" />
          </div>
          <TopNav />
          <main className="relative z-10 flex-1">
            <AuthProvider>{children}</AuthProvider>
          </main>
        </div>
      </body>
    </html>
  );
}