import { ReactNode } from 'react';
import PageContainer from '@/components/PageContainer';
import StaffHeader from '@/components/staff/StaffHeader';
import StaffTabs from '@/components/staff/StaffTabs';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type StaffLayoutProps = {
  children: ReactNode;
  params: { id: string };
};

export default async function StaffLayout({ children, params }: StaffLayoutProps) {
  const supabase = createServerClient();
  const { data: staff, error } = await supabase
    .from('employees')
    .select('id, full_name, role, phone, email, address, avatar_url')
    .eq('id', params.id)
    .single();

  if (error || !staff) {
    return <div className="p-6 text-sm text-neutral-600">Staff not found.</div>;
  }

  return (
    <PageContainer>
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <StaffHeader staff={staff} />
        <StaffTabs staffId={params.id} />
      </div>
      <div className="mt-4">{children}</div>
    </PageContainer>
  );
}
