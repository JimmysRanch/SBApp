"use client";
import { useState } from "react";
import Widget from "@/components/Widget";

type Props = { employeeId: string };

type Prefs = {
  email: boolean;
  sms: boolean;
};

export default function PreferencesEditor({ employeeId }: Props) {
  const [prefs, setPrefs] = useState<Prefs>({ email: true, sms: false });

  return (
    <Widget title="Preferences" color="purple">
      <div className="space-y-2 text-sm text-gray-700">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={prefs.email}
            onChange={(e) => setPrefs({ ...prefs, email: e.target.checked })}
          />
          Email notifications
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={prefs.sms}
            onChange={(e) => setPrefs({ ...prefs, sms: e.target.checked })}
          />
          SMS notifications
        </label>
      </div>
    </Widget>
  );
}
