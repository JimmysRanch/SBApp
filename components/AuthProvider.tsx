"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

import { mapProfileRow, type Role, type UserProfile } from "@/lib/auth/profile";
import { supabase } from "@/lib/supabase/client";

type AuthProviderProps = {
  children: React.ReactNode;
  initialSession?: Session | null;
  initialProfile?: UserProfile | null;
};

type Permissions = {
  canAccessSettings: boolean;
  canManageCalendar: boolean;
  canManageEmployees: boolean;
  canViewReports: boolean;
  raw: Record<string, unknown>;
};

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  email: string | null;
  displayName: string | null;
  role: Role;
  profile: UserProfile | null;
  isOwner: boolean;
  permissions: Permissions;
  sessionExpiresAt: number | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const defaultPermissions: Permissions = {
  canAccessSettings: false,
  canManageCalendar: false,
  canManageEmployees: false,
  canViewReports: false,
  raw: {},
};

const AuthContext = createContext<AuthContextValue>({
  loading: true,
  session: null,
  user: null,
  email: null,
  displayName: null,
  role: 'client',
  profile: null,
  isOwner: false,
  permissions: defaultPermissions,
  sessionExpiresAt: null,
  refreshProfile: async () => undefined,
  signOut: async () => undefined,
});

export function useAuth() {
  return useContext(AuthContext);
}

function permissionsForRole(role: Role): Permissions {
  switch (role) {
    case "master":
    case "admin":
      return {
        canAccessSettings: true,
        canManageCalendar: true,
        canManageEmployees: true,
        canViewReports: true,
        raw: { role },
      };
    case "senior_groomer":
      return {
        canAccessSettings: false,
        canManageCalendar: true,
        canManageEmployees: false,
        canViewReports: true,
        raw: { role },
      };
    case "groomer":
      return {
        canAccessSettings: false,
        canManageCalendar: true,
        canManageEmployees: false,
        canViewReports: false,
        raw: { role },
      };
    case "receptionist":
      return {
        canAccessSettings: false,
        canManageCalendar: true,
        canManageEmployees: false,
        canViewReports: false,
        raw: { role },
      };
    case "client":
      return {
        canAccessSettings: false,
        canManageCalendar: false,
        canManageEmployees: false,
        canViewReports: false,
        raw: { role: role ?? "client" },
      };
  }
}

async function loadUserProfile(user: User | null): Promise<UserProfile | null> {
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load user profile", error);
    return null;
  }

  return mapProfileRow(data);
}

export default function AuthProvider({
  children,
  initialSession = null,
  initialProfile = null,
}: AuthProviderProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [loading, setLoading] = useState(() => !initialSession);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(() =>
    normaliseExpiry(initialSession)
  );

  useEffect(() => {
    setSession(initialSession ?? null);
    setUser(initialSession?.user ?? null);
    setProfile(initialProfile ?? null);
    setLoading((prev) => (initialSession ? false : prev));
    setSessionExpiresAt(normaliseExpiry(initialSession));
  }, [initialProfile, initialSession]);

  useEffect(() => {
    let active = true;

    const syncBrowserSession = async () => {
      try {
        const { data: current } = await supabase.auth.getSession();
        if (!initialSession) {
          if (active && current.session) {
            await supabase.auth.signOut();
          }
          return;
        }

        const currentSession = current.session;
        const accessTokenMatches = currentSession?.access_token === initialSession.access_token;
        const refreshTokenMatches = currentSession?.refresh_token === initialSession.refresh_token;

        if (!active) return;

        if (!accessTokenMatches || !refreshTokenMatches) {
          if (!initialSession.refresh_token) {
            console.warn("Missing refresh token for Supabase session sync");
            return;
          }
          const { error } = await supabase.auth.setSession({
            access_token: initialSession.access_token,
            refresh_token: initialSession.refresh_token,
          });
          if (error) {
            console.error("Failed to synchronise Supabase session", error);
          }
        }
      } catch (error) {
        console.error("Failed to prime Supabase session", error);
      }
    };

    void syncBrowserSession();

    return () => {
      active = false;
    };
  }, [initialSession]);

  useEffect(() => {
    let active = true;

    const shouldLoadSession = !initialSession;
    const shouldLoadProfile = !initialProfile;

    const initialise = async () => {
      try {
        let nextSession = initialSession ?? null;

        if (shouldLoadSession) {
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();

          if (!active) return;

          nextSession = currentSession ?? null;
        }

        if (!active) return;

        setSession(nextSession);
        const nextUser = nextSession?.user ?? null;
        setUser(nextUser);
        setSessionExpiresAt(normaliseExpiry(nextSession));

        if (!shouldLoadProfile) return;

        if (!nextUser) {
          setProfile(null);
          return;
        }

        const nextProfile = await loadUserProfile(nextUser);
        if (!active) return;
        setProfile(nextProfile);
      } catch (error) {
        console.error("Unable to initialise auth session", error);
      } finally {
        if (active && (shouldLoadSession || shouldLoadProfile)) {
          setLoading(false);
        }
      }
    };

    if (shouldLoadSession || shouldLoadProfile) {
      void initialise();
    }

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, nextSession) => {
        if (!active) return;

        setSession(nextSession ?? null);
        const nextUser = nextSession?.user ?? null;
        setUser(nextUser);
        setSessionExpiresAt(normaliseExpiry(nextSession));

        if (!nextUser) {
          setProfile(null);
          setLoading(false);
          setSessionExpiresAt(null);
          if (event === "SIGNED_OUT") {
            router.push("/login");
          }
          return;
        }

        if (event !== "TOKEN_REFRESHED") {
          const nextProfile = await loadUserProfile(nextUser);
          if (!active) return;
          setProfile(nextProfile);
        }

        setLoading(false);

        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          router.refresh();
        }
      }
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [initialProfile, initialSession, router]);

  const refreshProfile = useCallback(async () => {
    const nextProfile = await loadUserProfile(user);
    setProfile(nextProfile);
  }, [user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setSessionExpiresAt(null);
    router.push("/login");
  }, [router]);

  const checkSession = useCallback(async () => {
    try {
      const {
        data: { session: latest },
      } = await supabase.auth.getSession();

      if (!latest) {
        console.info("Auth session has expired during inactivity – signing out.");
        await signOut();
        return;
      }

      setSession(latest);
      setUser(latest.user ?? null);
      setSessionExpiresAt(normaliseExpiry(latest));
    } catch (error) {
      console.error("Failed to verify auth session", error);
    }
  }, [signOut]);

  useEffect(() => {
    if (!Number.isFinite(sessionExpiresAt)) return;

    const expiryTimestamp = sessionExpiresAt * 1000;
    if (!Number.isFinite(expiryTimestamp)) {
      console.warn("Received invalid session expiry timestamp", sessionExpiresAt);
      return;
    }

    const millisecondsUntilExpiry = expiryTimestamp - Date.now();

    if (millisecondsUntilExpiry <= 0) {
      void signOut();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      console.info("Auth session reached expiry – logging out user.");
      void signOut();
    }, millisecondsUntilExpiry);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [sessionExpiresAt, signOut]);

  useEffect(() => {
    if (!Number.isFinite(sessionExpiresAt)) return;

    const expiryTimestamp = sessionExpiresAt * 1000;
    if (!Number.isFinite(expiryTimestamp)) {
      console.warn("Received invalid session expiry timestamp", sessionExpiresAt);
      return;
    }

    const millisecondsUntilExpiry = expiryTimestamp - Date.now();

    if (millisecondsUntilExpiry <= 0) {
      console.info("Auth session already expired – awaiting sign-out.");
      return;
    }

    const minutes = Math.floor(millisecondsUntilExpiry / 60000);
    const seconds = Math.floor((millisecondsUntilExpiry % 60000) / 1000);
    const formattedExpiry = new Date(expiryTimestamp).toLocaleString();

    console.info(
      `[auth] Session timeout: ${minutes}m ${seconds}s remaining (expires at ${formattedExpiry}).`
    );
  }, [sessionExpiresAt]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkSession();
      }
    };

    const handleFocus = () => {
      void checkSession();
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkSession]);

  const email = user?.email ?? null;
  const role = profile?.role ?? "client";
  const displayName = useMemo(() => {
    if (profile?.full_name) return profile.full_name;
    if (user?.user_metadata?.full_name && typeof user.user_metadata.full_name === "string") {
      const trimmed = user.user_metadata.full_name.trim();
      if (trimmed.length > 0) return trimmed;
    }
    if (email) return email;
    return null;
  }, [email, profile?.full_name, user?.user_metadata?.full_name]);

  const permissions = useMemo(() => permissionsForRole(role), [role]);
  const isOwner = role === "master";

  const value: AuthContextValue = {
    loading,
    session,
    user,
    email,
    displayName,
    role,
    profile,
    isOwner,
    permissions,
    sessionExpiresAt,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function normaliseExpiry(session: Session | null | undefined): number | null {
  if (!session) return null;

  const { expires_at: expiresAt, expires_in: expiresIn } = session;

  if (typeof expiresAt === "number" && Number.isFinite(expiresAt)) {
    return expiresAt;
  }

  if (typeof expiresIn === "number" && Number.isFinite(expiresIn)) {
    const secondsFromNow = Math.max(0, Math.floor(expiresIn));
    return Math.floor(Date.now() / 1000) + secondsFromNow;
  }

  return null;
}
