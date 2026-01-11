import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-bold text-xl">
              <Link href={"/"} className="flex items-center gap-2">
                <img src="/logo-black.png" alt="QA Logo" className="h-10 w-auto dark:hidden" />
                <img src="/logo-white.png" alt="QA Logo" className="h-10 w-auto hidden dark:block" />
                <span>Tracker</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Suspense>
                <AuthButton />
              </Suspense>
            </div>
          </div>
        </nav>
        <div className="flex-1 w-full flex flex-col gap-20 max-w-5xl p-5">
          {children}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            &copy; 2026 QA Tracker. All rights reserved.
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
