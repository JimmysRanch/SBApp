"use client";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

function isMissingColumnError(error: PostgrestError | null) {
  if (!error) return false;
  if (error.code === "42703") return true;
  const message = error.message?.toLowerCase() ?? "";
  return message.includes("column") && message.includes("does not exist");
}

export type CurrentEmployeeResolution = {
  userId: string | null;
  email: string | null;
  employeeId: number | null;
  method: "user_id" | "email" | null;
  error: string | null;
};

function normaliseId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function resolveCurrentEmployee(): Promise<CurrentEmployeeResolution> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    return { userId: null, email: null, employeeId: null, method: null, error: authError.message };
  }

  const user = authData.user;
  if (!user) {
    return { userId: null, email: null, employeeId: null, method: null, error: "No logged-in user" };
  }

  const userId = user.id ?? null;
  const email = typeof user.email === "string" ? user.email : null;

  if (userId) {
    const { data, error } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      const employeeId = normaliseId((data as { id: unknown }).id);
      if (employeeId !== null) {
        return { userId, email, employeeId, method: "user_id", error: null };
      }
    }

    if (error && !isMissingColumnError(error as PostgrestError)) {
      return { userId, email, employeeId: null, method: "user_id", error: error.message };
    }
  }

  if (email) {
    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      const { data, error } = await supabase
        .from("employees")
        .select("id")
        .ilike("email", trimmedEmail)
        .maybeSingle();

      if (!error && data) {
        const employeeId = normaliseId((data as { id: unknown }).id);
        if (employeeId !== null) {
          return { userId, email, employeeId, method: "email", error: null };
        }
      }

      if (error && !isMissingColumnError(error as PostgrestError)) {
        return { userId, email, employeeId: null, method: "email", error: error.message };
      }
    }
  }

  return {
    userId,
    email,
    employeeId: null,
    method: null,
    error: "Employee record not found for the current user",
  };
}
