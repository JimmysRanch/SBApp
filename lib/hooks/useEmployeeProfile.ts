'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface EmployeeProfile {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  photo_url?: string | null;
}

export function useEmployeeProfile(id: string) {
  const [data, setData] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, role, phone, email, photo_url')
        .eq('id', id)
        .single();
      if (error) {
        setError(error as any);
      } else {
        setData(data as EmployeeProfile);
      }
      setLoading(false);
    };
    run();
  }, [id]);

  return { data, loading, error };
}
