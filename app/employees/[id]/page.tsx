'use client';
import ProfileCard from '@/app/(employees)/components/ProfileCard';
import { useEmployeeProfile } from '@/lib/hooks/useEmployeeProfile';

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const { data, loading, error } = useEmployeeProfile(params.id);

  if (loading) return <p>Loading…</p>;
  if (error || !data) return <p>Error loading employee.</p>;

  return (
    <div className="p-4">
      <ProfileCard profile={data} />
    </div>
  );
}
