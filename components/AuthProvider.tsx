"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Role =
  | "Master Account"
  | "Manager"
  | "Front Desk"
  | "Groomer"
  | "Admin"
  | "Client"
  | string
  | null;

type AuthState = {
  loading: boolean;
  role: Role;
  profile: { id: string; email: string | null; role: Role } | null;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<AuthState>({
  loading: true,
  role: null,
  profile: null,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [profile, setProfile] = useState<AuthState["profile"]>(null);

  const load = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const user = session?.user ?? null;

      if (!user) {
        setRole("Guest");
        setProfile(null);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const resolvedRole = (profileData?.role ?? "Guest") as Role;

      setRole(resolvedRole);
      setProfile({
        id: profileData?.id ?? user.id,
        email: profileData?.email ?? user.email ?? null,
        role: resolvedRole,
      });
    } catch (error) {
      console.error("Failed to load auth session:", error);
      setRole("Guest");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const value = useMemo(() => ({ loading, role, profile, refresh: load }), [loading, role, profile]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

export default AuthProvider;
