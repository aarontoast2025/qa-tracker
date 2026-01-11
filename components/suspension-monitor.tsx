"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SuspensionMonitorProps {
  userId: string;
}

export function SuspensionMonitor({ userId }: SuspensionMonitorProps) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check suspension status immediately on mount
    const checkSuspensionStatus = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_suspended')
        .eq('id', userId)
        .single();

      if (!error && data?.is_suspended) {
        // User is suspended, log them out immediately
        await supabase.auth.signOut();
        router.push('/auth/login?message=Your account has been suspended. Please contact an administrator.');
      }
    };

    checkSuspensionStatus();

    // Set up real-time listener for suspension changes
    const channel = supabase
      .channel('suspension-monitor')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          const newData = payload.new as { is_suspended: boolean };
          
          if (newData.is_suspended) {
            // User just got suspended, log them out immediately
            await supabase.auth.signOut();
            router.push('/auth/login?message=Your account has been suspended. Please contact an administrator.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router, supabase]);

  return null; // This component doesn't render anything
}
