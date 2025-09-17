import Image from 'next/image';
import { EnvelopeIcon, PhoneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

type StaffSummary = {
  id: string;
  full_name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  avatar_url?: string | null;
};

export default function StaffHeader({ staff }: { staff: StaffSummary }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <Image
          src={staff.avatar_url || '/avatar.png'}
          alt={staff.full_name}
          width={64}
          height={64}
          className="h-16 w-16 rounded-full border border-neutral-200 object-cover"
          unoptimized
        />
        <div>
          <div className="text-lg font-semibold leading-tight text-neutral-900 md:text-xl">
            {staff.full_name}
          </div>
          {staff.role && <div className="text-sm text-neutral-600">{staff.role}</div>}
          <div className="text-xs text-neutral-500">
            {[staff.email, staff.phone].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {staff.phone && (
          <a
            href={`tel:${staff.phone}`}
            className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-pink-700"
          >
            <PhoneIcon className="h-4 w-4" />
            Call
          </a>
        )}
        {staff.phone && (
          <a
            href={`sms:${staff.phone}`}
            className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-pink-700"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            Text
          </a>
        )}
        {staff.email && (
          <a
            href={`mailto:${staff.email}`}
            className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-pink-700"
          >
            <EnvelopeIcon className="h-4 w-4" />
            Email
          </a>
        )}
      </div>
    </div>
  );
}
