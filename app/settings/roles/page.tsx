"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import { supabase } from "@/lib/supabase/client";

import type { Role } from "@/lib/auth/roles";

type EditableRole = Pick<Role, "id" | "name" | "permissions">;

function parsePermissions(input: string): string[] {
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
  } catch (error) {
    // ignore, validation happens below
  }
  throw new Error("Permissions must be a JSON array of strings");
}

function formatPermissions(perms: string[] | null | undefined): string {
  return JSON.stringify(perms ?? []);
}

export default function RolesSettingsPage() {
  const [roles, setRoles] = useState<EditableRole[]>([]);
  const [name, setName] = useState("");
  const [rawPermissions, setRawPermissions] = useState("[]");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sortedRoles = useMemo(
    () => [...roles].sort((a, b) => a.name.localeCompare(b.name)),
    [roles],
  );

  const load = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("id,name,permissions")
        .order("name", { ascending: true });

      if (error) throw error;
      setRoles((data ?? []) as EditableRole[]);
    } catch (error: any) {
      setMessage(error?.message ?? "Unable to load roles.");
      setRoles([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addRole = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const permissions = parsePermissions(rawPermissions.trim());
      const { error } = await supabase
        .from("roles")
        .insert({ name: name.trim(), permissions });

      if (error) throw error;
      setName("");
      setRawPermissions("[]");
      setMessage("Role added successfully.");
      await load();
    } catch (error: any) {
      setMessage(error?.message ?? "Unable to add role.");
    } finally {
      setBusy(false);
    }
  }, [load, name, rawPermissions]);

  const removeRole = useCallback(
    async (id: string) => {
      setBusy(true);
      setMessage(null);
      try {
        const { error } = await supabase.from("roles").delete().eq("id", id);
        if (error) throw error;
        setMessage("Role deleted.");
        await load();
      } catch (error: any) {
        setMessage(error?.message ?? "Unable to delete role.");
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const disableSubmit = !name.trim() || !rawPermissions.trim();

  return (
    <PageContainer>
      <Card>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Roles &amp; Permissions</h1>
            <p className="text-sm text-gray-600">
              Create lightweight roles to group permissions for your staff.
            </p>
            {message && <p className="text-sm font-semibold text-brand-bubbleDark">{message}</p>}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <label className="flex-1 text-sm">
                <span className="mb-1 block font-medium text-gray-700">Role name</span>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-bubble focus:outline-none focus:ring-1 focus:ring-brand-bubble"
                  disabled={busy}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Front Desk"
                  value={name}
                />
              </label>

              <label className="flex-1 text-sm">
                <span className="mb-1 block font-medium text-gray-700">Permissions (JSON)</span>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs focus:border-brand-bubble focus:outline-none focus:ring-1 focus:ring-brand-bubble"
                  disabled={busy}
                  onChange={(event) => setRawPermissions(event.target.value)}
                  placeholder='["can_manage_schedule"]'
                  value={rawPermissions}
                />
              </label>

              <button
                className="h-10 shrink-0 rounded-lg bg-brand-bubble px-4 text-sm font-semibold text-white transition hover:bg-brand-bubbleDark disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy || disableSubmit}
                onClick={addRole}
                type="button"
              >
                {busy ? "Saving…" : "Add role"}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Enter permissions as a JSON array of string keys. Example: <code>[&quot;can_manage_calendar&quot;]</code>
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedRoles.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={3}>
                      {busy ? "Loading roles…" : "No roles created yet."}
                    </td>
                  </tr>
                )}

                {sortedRoles.map((role) => (
                  <tr key={role.id} className="bg-white">
                    <td className="px-4 py-3 font-medium text-gray-900">{role.name}</td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                        {formatPermissions(role.permissions)}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-sm font-semibold text-red-500 transition hover:text-red-600"
                        disabled={busy}
                        onClick={() => removeRole(role.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
