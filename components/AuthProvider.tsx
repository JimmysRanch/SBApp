// components/AuthProvider.tsx
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
import type { Session, User } from "@supabase/supabase-js";

import type { EmployeeProfile } from "@/lib/auth/profile";
import { mapEmployeeRowToProfile, normaliseName, normaliseRole } from "@/lib/auth/profile";
import { supabase } from "@/lib/supabase/client";

type AuthProviderProps = {
  children: React.ReactNode;
  initialSession?: Session | null;
  initialProfile?: EmployeeProfile | null;
};

type AuthContextValue = {
  loading: boolean
  session: Session | null
  user: User | null
  email: string | null
  displayName: string | null
  role: string | null
  profile: EmployeeProfile | null
  isOwner: boolean
  permissions: {
    canAccessSettings: boolean
    canManageCalendar: boolean
    canManageEmployees: boolean
    canViewReports: boolean
    raw: Record<string, unknown>
  }
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const defaultPermissions = {
  canAccessSettings: false,
  canManageCalendar: false,
  canManageEmployees: false,
  canViewReports: false,
  raw: {} as Record<string, unknown>,
}

const AuthContext = createContext<AuthContextValue>({
  loading: true,
  session: null,
  user: null,
  email: null,
  displayName: null,
  role: null,
  profile: null,
  isOwner: false,
  permissions: defaultPermissions,
  refreshProfile: async () => undefined,
  signOut: async () => undefined,
});

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchProfile(user: User): Promise<EmployeeProfile | null> {
  if (!user.email) return null;
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("id,name,role,app_permissions")
      .eq("email", user.email)
      .maybeSingle();

    if (error) {
      console.error("Failed to load employee profile", error);
      return null;
    }

    return mapEmployeeRowToProfile(data);
  } catch (error) {
    console.error("Unexpected error loading profile", error);
    return null;
  }
}

export default function AuthProvider({
  children,
  initialSession = null,
  initialProfile = null,
}: AuthProviderProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(initialProfile);
  const [loading, setLoading] = useState(() => !initialSession);
  const [email, setEmail] = useState<string | null>(() => {
    if (initialSession?.user?.email) return initialSession.user.email;
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("sb-email");
    }
    return null;
  });

  const ownerEmails = useMemo(() => {
    const combined = [
      process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "",
      process.env.NEXT_PUBLIC_OWNER_EMAILS ?? "",
    ]
      .filter(Boolean)
      .join(",");

    return combined
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0);
  }, []);

  const loadProfile = useCallback(async (targetUser: User | null) => {
    if (!targetUser) return null;
    return fetchProfile(targetUser);
  }, []);

  useEffect(() => {
    setSession(initialSession ?? null);
    setUser(initialSession?.user ?? null);
    setProfile(initialProfile ?? null);
    if (initialSession?.user?.email) {
      setEmail(initialSession.user.email);
    }
    setLoading((prev) => (initialSession ? false : prev));
  }, [initialProfile, initialSession]);

  useEffect(() => {
    let active = true;

    const initialise = async () => {
      try {
        setLoading(true);
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        if (!active) return;
        setSession(initialSession ?? null);
        const initialUser = initialSession?.user ?? null;
        setUser(initialUser);
        const nextEmail = initialUser?.email ?? null;
        setEmail(nextEmail);
        const initialProfile = await loadProfile(initialUser);
        if (!active) return;
        setProfile(initialProfile);
      } catch (error) {
        console.error("Unable to load auth session", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void initialise();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!active) return;
        setSession(nextSession ?? null);
        const nextUser = nextSession?.user ?? null;
        setUser(nextUser);
        const nextEmail = nextUser?.email ?? null;
        setEmail(nextEmail);
        const nextProfile = await loadProfile(nextUser);
        if (!active) return;
        setProfile(nextProfile);
        setLoading(false);
        router.refresh();
      }
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (email) {
      window.localStorage.setItem("sb-email", email);
    } else {
      window.localStorage.removeItem("sb-email");
    }
  }, [email]);

  const permissionsRaw = useMemo<Record<string, unknown>>(() => {
    if (profile?.app_permissions && typeof profile.app_permissions === "object") {
      return profile.app_permissions as Record<string, unknown>;
    }
    return {};
  }, [profile?.app_permissions]);

  const permissionFlags = useMemo<Record<string, boolean>>(() => {
    return Object.entries(permissionsRaw).reduce<Record<string, boolean>>((acc, [key, value]) => {
      if (typeof value === "boolean") {
        acc[key] = value;
      }
      return acc;
    }, {});
  }, [permissionsRaw]);

  const metadataRole = useMemo(() => {
    if (!user) return null;
    return (
      normaliseRole((user.user_metadata as Record<string, unknown> | undefined)?.role) ??
      null
    );
  }, [user]);

  const roleIndicators = useMemo(() => {
    const roles: string[] = [];
    if (profile?.role) {
      roles.push(profile.role);
    }
    if (metadataRole) {
      roles.push(metadataRole);
    }
    return roles
      .map((role) => role.toLowerCase())
      .filter((role) => role.length > 0);
  }, [metadataRole, profile?.role]);

  const emailLower = (email ?? "").toLowerCase();

  const isOwner = useMemo(() => {
    if (emailLower && ownerEmails.includes(emailLower)) return true;
    if (roleIndicators.some((role) => role.includes("owner") || role.includes("admin"))) {
      return true;
    }
    if (permissionFlags.is_owner === true || permissionFlags.is_manager === true) {
      return true;
    }
    return false;
  }, [emailLower, ownerEmails, permissionFlags, roleIndicators]);

  const displayName = useMemo(() => {
    if (profile?.name) return profile.name;
    const metaName = normaliseName(
      (user?.user_metadata as Record<string, unknown> | undefined)?.full_name ??
        (user?.user_metadata as Record<string, unknown> | undefined)?.name
    );
    if (metaName) return metaName;
    return email;
  }, [email, profile?.name, user]);

  const roleLabel = useMemo(() => {
    if (profile?.role) return profile.role;
    if (metadataRole) return metadataRole;
    if (isOwner) return "Owner";
    return null;
  }, [isOwner, metadataRole, profile?.role]);

  const permissions = useMemo(() => {
    const canManageCalendar =
      isOwner ||
      permissionFlags.can_edit_schedule === true ||
      permissionFlags.is_manager === true;
    const canManageEmployees =
      isOwner ||
      permissionFlags.can_manage_discounts === true ||
      permissionFlags.is_manager === true;
    const canViewReports =
      isOwner || permissionFlags.can_view_reports === true || permissionFlags.is_manager === true;
    const canAccessSettings = isOwner || canManageEmployees || canViewReports;

    return {
      canAccessSettings,
      canManageCalendar,
      canManageEmployees,
      canViewReports,
      raw: permissionsRaw,
    };
  }, [isOwner, permissionFlags, permissionsRaw]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const result = await loadProfile(user);
    setProfile(result);
  }, [loadProfile, user]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Failed to sign out", error);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setEmail(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("sb-email");
      }
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user,
      email,
      displayName,
      role: roleLabel,
      profile,
      isOwner,
      permissions,
      refreshProfile,
      signOut,
    }),
    [
      displayName,
      email,
      isOwner,
      loading,
      permissions,
      profile,
      refreshProfile,
      roleLabel,
      session,
      signOut,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
