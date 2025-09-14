"use client";
/* eslint-disable @next/next/no-img-element */
import Card from "@/components/Card";

type Emp = {
  id: number;
  name: string;
  active: boolean | null;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  photo_url?: string | null;
  photo?: string | null;
};

export default function ProfileCard({ employee }: { employee: Emp }) {
  const photo = employee.photo_url || employee.photo;
  return (
    <Card>
      <div className="flex items-center gap-4">
        <img
          src={photo || "https://via.placeholder.com/80"}
          alt={employee.name}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{employee.name}</h3>
          {employee.role && <p className="text-sm text-gray-600">{employee.role}</p>}
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            employee.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
          }`}
        >
          {employee.active ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="mt-4 space-y-1 text-sm text-gray-700">
        {employee.phone && <div>{employee.phone}</div>}
        {employee.email && <div>{employee.email}</div>}
        {employee.address && <div>{employee.address}</div>}
      </div>
      <div className="mt-4 flex gap-2">
        {employee.phone && (
          <a
            href={`tel:${employee.phone}`}
            className="rounded border px-3 py-1 text-sm"
          >
            Call
          </a>
        )}
        {employee.phone && (
          <a
            href={`sms:${employee.phone}`}
            className="rounded border px-3 py-1 text-sm"
          >
            Text
          </a>
        )}
        {employee.email && (
          <a
            href={`mailto:${employee.email}`}
            className="rounded border px-3 py-1 text-sm"
          >
            Email
          </a>
        )}
      </div>
    </Card>
  );
}
