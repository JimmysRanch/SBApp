"use client";
import Card from "@/components/Card";
type Emp = { id: number; name: string; active: boolean | null };
export default function ProfileCard({ employee }: { employee: Emp }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Profile</h3>
        <span className={`text-xs px-2 py-0.5 rounded ${employee.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
          {employee.active ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="mt-3 text-sm text-gray-700">
        <div>ID: {employee.id}</div>
        <div>Name: {employee.name}</div>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="rounded border px-3 py-1 text-sm">Call</button>
        <button className="rounded border px-3 py-1 text-sm">Text</button>
        <button className="rounded border px-3 py-1 text-sm">Email</button>
      </div>
    </Card>
  );
}
