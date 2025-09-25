"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { normaliseRole, type Role } from "@/lib/auth/profile";
import { roleDisplayName } from "@/lib/auth/access";

type ResolvedRole = Role | "guest" | null;

type AuthState = {
  loading: boolean;
  role: ResolvedRole;
  roleLabel: string | null;
  profile: { id: string; email: string | null; role: Role } | null;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<AuthState>({
  loading: true,
  role: null,
  roleLabel: null,
  profile: null,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<ResolvedRole>(null);
  const [roleLabel, setRoleLabel] = useState<string | null>(null);
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
        setRole("guest");
        setRoleLabel("Guest");
        setProfile(null);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const resolvedRole = normaliseRole(profileData?.role);
      setRole(resolvedRole);
      setRoleLabel(roleDisplayName(resolvedRole));
      setProfile({
        id: profileData?.id ?? user.id,
        email: user.email ?? null,
        role: resolvedRole,
      });
    } catch (error) {
      console.error("Failed to load auth session:", error);
      setRole("guest");
      setRoleLabel("Guest");
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

  const value = useMemo(
    () => ({ loading, role, roleLabel, profile, refresh: load }),
    [loading, role, roleLabel, profile]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

export default AuthProvider;
