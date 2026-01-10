"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpdatePasswordContent className={className} {...props} />
    </Suspense>
  );
}

function UpdatePasswordContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      
      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setSessionChecked(true);
        }
      });
      
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is already signed in (invitation link was clicked)
        setSessionChecked(true);
      } else {
        // No session yet, wait a moment for Supabase to process the URL
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            setSessionChecked(true);
          } else {
            setError("Unable to verify your invitation. Please try clicking the invitation link again.");
          }
        }, 1000);
      }

      return () => {
        subscription.unsubscribe();
      };
    };

    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Validate password length
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      // Redirect to home page after successful password update
      router.push("/");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 font-bold text-2xl">
          <img src="/logo-black.png" alt="QA Logo" className="h-12 w-auto dark:hidden" />
          <img src="/logo-white.png" alt="QA Logo" className="h-12 w-auto hidden dark:block" />
          <span>Tracker</span>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Set Your Password</CardTitle>
          <CardDescription>
            Welcome! Please create a secure password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-10 text-xl tracking-tighter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-10 text-xl tracking-tighter"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                  />
                </div>
              </div>
              {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting password...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Set Password
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
