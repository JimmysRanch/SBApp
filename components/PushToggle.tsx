"use client";

import { useEffect, useState } from "react";

export default function PushToggle() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    }
  }, []);
  async function enable() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    // placeholder token flow; backend can replace later
    await fetch("/api/notifications/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "placeholder", platform: "web" }),
    });
    setEnabled(true);
  }
  return (
    <button onClick={enable} disabled={enabled}>
      {enabled ? "Push Enabled" : "Enable Push"}
    </button>
  );
}
