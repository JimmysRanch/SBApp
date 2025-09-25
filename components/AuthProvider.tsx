"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

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
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = await res.json();
      setRole((data?.role ?? null) as Role);
      setProfile(data?.profile ?? null);
    } catch {
      setRole(null);
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
