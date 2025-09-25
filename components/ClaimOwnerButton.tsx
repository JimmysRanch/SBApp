"use client";
import { useState } from "react";

export default function ClaimOwnerButton() {
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    const r = await fetch("/api/admin/claim-owner", { method: "POST" });
    setBusy(false);
    if (!r.ok) {
      const { error } = await r.json().catch(() => ({ error: "Failed" }));
      alert(error || "Failed");
      return;
    }
    location.reload();
  }
  return (
    <button onClick={run} disabled={busy} style={{ marginLeft: 8 }}>
      {busy ? "Fixing…" : "Claim Owner"}
    </button>
  );
}
