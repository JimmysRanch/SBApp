import Image from "next/image";

interface StaffHeaderProps {
  staff: {
    name: string | null;
    role?: string | null;
    active?: boolean | null;
    email?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    address_street?: string | null;
    address_city?: string | null;
    address_state?: string | null;
    address_zip?: string | null;
  };
}

export default function StaffHeader({ staff }: StaffHeaderProps) {
  const address = staff.address_street
    ? `${staff.address_street}, ${staff.address_city ?? ""} ${staff.address_state ?? ""} ${staff.address_zip ?? ""}`.trim()
    : "";

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Image
          src={staff.avatar_url || "/avatar.png"}
          alt="Profile avatar"
          width={56}
          height={56}
          className="h-14 w-14 rounded-full object-cover"
        />
        <div>
          <div className="text-xl font-semibold leading-tight">{staff.name}</div>
          <div className="text-sm text-neutral-600">{staff.role || (staff.active ? "Active" : "Inactive")}</div>
          <div className="text-xs text-neutral-500">
            {staff.email}
            {staff.phone ? ` · ${staff.phone}` : ""}
            {address ? ` · ${address}` : ""}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {staff.phone && (
          <a href={`tel:${staff.phone}`} className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-neutral-50">
            Call
          </a>
        )}
        {staff.phone && (
          <a href={`sms:${staff.phone}`} className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-neutral-50">
            Text
          </a>
        )}
        {staff.email && (
          <a href={`mailto:${staff.email}`} className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-neutral-50">
            Email
          </a>
        )}
      </div>
    </div>
  );
}
