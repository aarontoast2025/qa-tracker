import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";
import { ChatWidget } from "@/components/chat/chat-widget";
import { SuspensionMonitor } from "@/components/suspension-monitor";
import { createClient } from "@/lib/supabase/server";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClipboardList, FileText, ChevronDown, Database, Book } from "lucide-react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
            
            <div className="flex items-center gap-6">
                <Link 
                    href="/knowledge-base" 
                    className="flex items-center gap-1 font-medium hover:text-primary transition-colors focus:outline-none"
                >
                    Knowledgebase
                </Link>

                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 font-medium hover:text-primary transition-colors focus:outline-none">
                        Assignments <ChevronDown className="h-4 w-4 opacity-50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href="/audit/assignments" className="cursor-pointer">
                                <ClipboardList className="mr-2 h-4 w-4" />
                                <span>Assignment Manager</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/audit/dashboard" className="cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" />
                                <span>QA Dashboard</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 font-medium hover:text-primary transition-colors focus:outline-none">
                        Audit <ChevronDown className="h-4 w-4 opacity-50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href="/audit/records" className="cursor-pointer">
                                <Database className="mr-2 h-4 w-4" />
                                <span>Audit Records</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/audit/form-builder" className="cursor-pointer">
                                <ClipboardList className="mr-2 h-4 w-4" />
                                <span>Form Builder</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/audit/feedback-builder" className="cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Feedback Builder</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/audit/guidelines" className="cursor-pointer">
                                <Book className="mr-2 h-4 w-4" />
                                <span>Guidelines</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

              <Suspense>
                <AuthButton />
              </Suspense>
            </div>
          </div>
        </nav>
        <div className="flex-1 w-full flex justify-center">
          {children}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            &copy; 2026 QA Tracker. All rights reserved.
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
      <ChatWidget />
      {user && <SuspensionMonitor userId={user.id} />}
    </main>
  );
}
