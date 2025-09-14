'use client';
import Image from 'next/image';

interface Profile {
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  photo_url?: string | null;
}

export default function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
          {profile.photo_url ? (
            <Image src={profile.photo_url} alt={profile.name} fill className="object-cover" />
          ) : null}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{profile.name}</h2>
          <p className="text-gray-600">{profile.role || '—'}</p>
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <p>{profile.phone || 'No phone'}</p>
            <p>{profile.email || 'No email'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
