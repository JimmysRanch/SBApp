import Card from '@/components/Card';
import PageContainer from '@/components/PageContainer';
import { createClient } from '@/lib/supabase/server';

import RangeSelect from './RangeSelect';
import { parseRangeParam, type RangeOption } from './range';

type Counts = {
  clients: number;
  newClients: number;
  pets: number;
  newPets: number;
  employees: number;
  appointments: number;
  completed: number;
  canceled: number;
  noShow: number;
  revenue: number;
  expectedRevenue: number;
  sales: number;
  topServices: [string, number][];
};

type ReportsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export const dynamic = 'force-dynamic';

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const range = parseRangeParam(searchParams?.range);

  let counts: Counts | null = null;
  let errorMessage: string | null = null;

  try {
    counts = await loadCounts(range);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unable to load reports';
  }

  return (
    <PageContainer>
      <Card>
        <h1 className="mb-4 text-3xl font-bold text-primary-dark">Reports</h1>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="range" className="font-medium">
            Date range:
          </label>
          <RangeSelect id="range" value={range} className="sm:w-48" />
        </div>
        {errorMessage ? (
          <div className="rounded-2xl border border-red-300/40 bg-red-100/40 px-4 py-3 text-sm text-red-700">
            Failed to load reports: {errorMessage}
          </div>
        ) : counts ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <ReportCard title="Total Clients" value={counts.clients} />
              <ReportCard title="New Clients" value={counts.newClients} />
              <ReportCard title="Total Pets" value={counts.pets} />
              <ReportCard title="New Pets" value={counts.newPets} />
              <ReportCard title="Employees" value={counts.employees} />
              <ReportCard title="Appointments" value={counts.appointments} />
              <ReportCard title="Completed" value={counts.completed} />
              <ReportCard title="Canceled" value={counts.canceled} />
              <ReportCard title="No-shows" value={counts.noShow} />
              <ReportCard title="Revenue" value={`$${counts.revenue.toFixed(2)}`} />
              <ReportCard title="Expected Revenue" value={`$${counts.expectedRevenue.toFixed(2)}`} />
              <ReportCard title="Sales" value={`$${counts.sales.toFixed(2)}`} />
            </div>
            <Card>
              <h2 className="mb-2 text-xl font-semibold">Top Services</h2>
              {counts.topServices.length === 0 ? (
                <p className="text-sm text-gray-500">No services found</p>
              ) : (
                <ul className="text-sm">
                  {counts.topServices.map(([service, count]) => (
                    <li key={service} className="flex justify-between border-b py-1 last:border-none">
                      <span>{service}</span>
                      <span className="font-medium">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        ) : null}
      </Card>
    </PageContainer>
  );
}

type AppointmentRow = {
  service: string | null;
  status: string | null;
  price: number | string | null;
};

type PaymentRow = {
  amount: number | string | null;
};

async function loadCounts(range: RangeOption): Promise<Counts> {
  const supabase = createClient();
  const { start, end } = getRangeDates(range);

  const clientsQuery = supabase.from('clients').select('id', { count: 'exact', head: true });
  const petsQuery = supabase.from('pets').select('id', { count: 'exact', head: true });
  const employeesQuery = supabase.from('employees').select('id', { count: 'exact', head: true });
  const apptCountQuery = supabase.from('appointments').select('id', { count: 'exact', head: true });

  let newClientsQuery = supabase.from('clients').select('id', { count: 'exact', head: true });
  let newPetsQuery = supabase.from('pets').select('id', { count: 'exact', head: true });
  let paymentsQuery = supabase.from('payments').select('amount');
  let apptDetailQuery = supabase.from('appointments').select('service, status, price');

  if (start && end) {
    const startISO = start.toISOString();
    const endISO = end.toISOString();
    newClientsQuery = newClientsQuery.gte('created_at', startISO).lt('created_at', endISO);
    newPetsQuery = newPetsQuery.gte('created_at', startISO).lt('created_at', endISO);
    paymentsQuery = paymentsQuery.gte('created_at', startISO).lt('created_at', endISO);
    apptDetailQuery = apptDetailQuery.gte('start_time', startISO).lt('start_time', endISO);
  }

  const [
    clientsRes,
    petsRes,
    employeesRes,
    apptCountRes,
    newClientsRes,
    newPetsRes,
    apptDetailRes,
    paymentsRes,
  ] = await Promise.all([
    clientsQuery,
    petsQuery,
    employeesQuery,
    apptCountQuery,
    newClientsQuery,
    newPetsQuery,
    apptDetailQuery,
    paymentsQuery,
  ]);

  const errors = [
    clientsRes.error,
    petsRes.error,
    employeesRes.error,
    apptCountRes.error,
    newClientsRes.error,
    newPetsRes.error,
    apptDetailRes.error,
    paymentsRes.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors[0]!.message);
  }

  const appts = (apptDetailRes.data ?? []) as AppointmentRow[];
  const payments = (paymentsRes.data ?? []) as PaymentRow[];

  const completed = appts.filter((a) => a.status === 'Completed').length;
  const canceled = appts.filter((a) => a.status === 'Cancelled').length;
  const noShow = appts.filter((a) => a.status === 'No show' || a.status === 'No-show').length;
  const revenue = appts.reduce(
    (sum, a) => sum + (a.status === 'Completed' ? Number(a.price || 0) : 0),
    0
  );
  const expectedRevenue = appts.reduce((sum, a) => sum + Number(a.price || 0), 0);
  const sales = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const serviceCounts: Record<string, number> = {};
  appts.forEach((a) => {
    const service = a.service || 'Other';
    serviceCounts[service] = (serviceCounts[service] || 0) + 1;
  });

  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3) as [string, number][];

  return {
    clients: clientsRes.count ?? 0,
    newClients: newClientsRes.count ?? 0,
    pets: petsRes.count ?? 0,
    newPets: newPetsRes.count ?? 0,
    employees: employeesRes.count ?? 0,
    appointments: apptCountRes.count ?? 0,
    completed,
    canceled,
    noShow,
    revenue,
    expectedRevenue,
    sales,
    topServices,
  };
}

function getRangeDates(range: RangeOption): { start?: Date; end?: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(24, 0, 0, 0);
      return { start, end };
    case 'week': {
      const day = now.getDay();
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 7);
      end.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'month': {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 1);
      end.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'year': {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(start.getFullYear() + 1, 0, 1);
      end.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'all':
    default:
      return {};
  }
}

function ReportCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="text-center">
      <div className="mb-1 text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </Card>
  );
}
