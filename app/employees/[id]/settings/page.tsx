'use client';

import { useState } from 'react';

export default function StaffSettings() {
  const [form] = useState({});
  void form;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h3 className="mb-2 text-base font-semibold text-neutral-900">Profile</h3>
        <p className="text-sm text-neutral-600">
          {/* fields: avatar, full_name, role, phone, email, address (street/city/state/zip), emergency contact */}
        </p>
      </section>
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h3 className="mb-2 text-base font-semibold text-neutral-900">Compensation &amp; Permissions</h3>
        <p className="text-sm text-neutral-600">
          {/* pay type (hourly/commission/salary/hybrid), commission %, allowed services, app permissions */}
        </p>
      </section>
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h3 className="mb-2 text-base font-semibold text-neutral-900">Preferences &amp; Goals</h3>
        <p className="text-sm text-neutral-600">
          {/* preferred breeds, not accepted breeds, specialties; weekly revenue target; desired dogs/day */}
        </p>
      </section>
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h3 className="mb-2 text-base font-semibold text-neutral-900">Private Manager Notes</h3>
        <p className="text-sm text-neutral-600">
          {/* textarea with manager-only visibility via RLS */}
        </p>
      </section>
    </div>
  );
}
