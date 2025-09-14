"use client";
import Card from "@/components/Card";
import Image from "next/image";

type Emp = {
  id: number;
  name: string;
  active: boolean | null;
  role: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  photo: string | null;
};

export default function ProfileCard({ employee }: { employee: Emp }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Profile</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded ${employee.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
        >
          {employee.active ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-4">
        {employee.photo ? (
          <Image
            src={employee.photo}
            alt={employee.name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-gray-200" />
        )}
        <div>
          <div className="font-medium">{employee.name}</div>
          <div className="text-sm text-gray-600">{employee.role || "—"}</div>
        </div>
      </div>
      <div className="mt-4 space-y-1 text-sm text-gray-700">
        <div>Phone: {employee.phone || "—"}</div>
        <div>Email: {employee.email || "—"}</div>
        <div>Address: {employee.address || "—"}</div>
      </div>
      <div className="mt-4 flex gap-2">
        <a
          href={employee.phone ? `tel:${employee.phone}` : undefined}
          className="rounded border px-3 py-1 text-sm"
        >
          Call
        </a>
        <a
          href={employee.phone ? `sms:${employee.phone}` : undefined}
          className="rounded border px-3 py-1 text-sm"
        >
          Text
        </a>
        <a
          href={employee.email ? `mailto:${employee.email}` : undefined}
          className="rounded border px-3 py-1 text-sm"
        >
          Email
        </a>
      </div>
    </Card>
  );
}
