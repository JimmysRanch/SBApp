"use client";
import { useState } from "react";
import Card from "@/components/Card";

type Props = { employeeId: string };

export default function NotesCard({ employeeId }: Props) {
  const [note, setNote] = useState("");

  return (
    <Card>
      <h2 className="mb-2 text-lg font-semibold">Notes</h2>
      <textarea
        className="w-full rounded border p-2 text-sm"
        placeholder={`Notes for ${employeeId}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </Card>
  );
}
