"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface PresenceUser {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  last_seen: string;
}

export function PresenceHeader() {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pathname = usePathname();
  const supabase = createClient();

  // Normalize channel name from pathname (e.g. /user-management -> user-management)
  const channelName = `presence:${pathname.replace(/\//g, "_") || "root"}`;

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile details for presence
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("first_name, last_name, avatar_url")
          .eq("id", user.id)
          .single();
        
        setCurrentUser({
          id: user.id,
          first_name: profile?.first_name || user.email?.split("@")[0] || "User",
          last_name: profile?.last_name || "",
          avatar_url: profile?.avatar_url
        });
      }
    }
    getUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: PresenceUser) => {
            // Avoid duplicates and don't show self if you want a cleaner look
            // but usually it's good to see self in the list too or filter out
            if (!users.find(u => u.user_id === p.user_id)) {
              users.push(p);
            }
          });
        });
        
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUser.id,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            avatar_url: currentUser.avatar_url,
            last_seen: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, channelName]);

  if (onlineUsers.length <= 1) return null; // Don't show if it's just me

  const MAX_VISIBLE = 5;
  const visibleUsers = onlineUsers.slice(0, MAX_VISIBLE);
  const remainingCount = onlineUsers.length - MAX_VISIBLE;

  return (
    <div className="relative group py-1">
      {/* Visible Avatar Stack */}
      <div className="flex items-center -space-x-2 cursor-pointer">
        {visibleUsers.map((user) => {
          const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
          const isMe = user.user_id === currentUser?.id;

          return (
            <div
              key={user.user_id}
              className={cn(
                "inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-medium overflow-hidden border border-border transition-transform shrink-0",
                isMe ? "z-10" : "z-0"
              )}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={`${user.first_name} ${user.last_name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          );
        })}
        
        {remainingCount > 0 && (
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-bold ring-2 ring-background shrink-0 z-0"
          >
            +{remainingCount}
          </div>
        )}

        <div className="pl-4 text-[10px] text-muted-foreground font-medium whitespace-nowrap hidden sm:block">
          {onlineUsers.length} viewing
        </div>
      </div>

      {/* Floating Popover on Hover */}
      <div className="absolute top-full right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
        <h4 className="text-xs font-bold mb-3 border-b pb-2 flex items-center justify-between">
          Active Viewers
          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px]">
            {onlineUsers.length}
          </span>
        </h4>
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {onlineUsers.map((user) => {
            const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
            const isMe = user.user_id === currentUser?.id;
            
            return (
              <div key={user.user_id} className="flex items-center gap-3 p-1.5 hover:bg-muted rounded-md transition-colors">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary overflow-hidden border border-border shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">
                    {user.first_name} {user.last_name} {isMe && "(You)"}
                  </p>
                  <p className="text-[9px] text-muted-foreground italic">
                    Viewing this page
                  </p>
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
