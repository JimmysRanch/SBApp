"use client";
import React from "react";
import { useAuth } from "@/components/AuthProvider";

export default function TopNav() {
  const { loading, roleLabel, profile } = useAuth();

  const badge = loading ? "…" : roleLabel ?? "Guest";
  const name = profile?.email ?? "User";

  return (
    <header className="topnav">
      <div className="right">
        <span>{name}</span>
        <span className="badge">{badge}</span>
      </div>
    </header>
  );
}
