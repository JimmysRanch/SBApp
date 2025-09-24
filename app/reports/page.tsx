import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import { createClient } from "@/lib/supabase/server";
import RangeSelect from "./RangeSelect";

const rangeOptions = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
] as const;

type RangeOption = (typeof rangeOptions)[number]["value"];

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

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function parseRangeParam(value: string | string[] | undefined): RangeOption {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return "today";
  return rangeOptions.some((option) => option.value === candidate)
    ? (candidate as RangeOption)
    : "today";
}

function getRangeDates(range: RangeOption): { start?: Date; end?: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(24, 0, 0, 0);
      return { start, end };
    case "week": {
      const day = now.getDay();
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 7);
      end.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 1);
      end.setHours(0, 0, 0, 0);
      return { start, end };
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(start.getFullYear() + 1, 0, 1);
      end.setHours(0, 0, 0, 0);
      return { start, end };
    case "all":
    default:
      return {};
  }
}

function applyRangeFilter<T extends { gte: (column: string, value: string) => T; lt: (column: string, value: string) => T }>(
  query: T,
  column: string,
  start?: string,
  end?: string,
) {
  let next = query;
  if (start) next = next.gte(column, start);
  if (end) next = next.lt(column, end);
  return next;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const revalidate = 0;

export default async function ReportsPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const range = parseRangeParam(searchParams?.range);
  const { start, end } = getRangeDates(range);
  const startIso = start?.toISOString();
  const endIso = end?.toISOString();

  const clientsQuery = supabase.from("clients").select("id", { count: "exact", head: true });
  const petsQuery = supabase.from("pets").select("id", { count: "exact", head: true });
  const employeesQuery = supabase.from("employees").select("id", { count: "exact", head: true });
  const appointmentsQuery = supabase
    .from("appointments")
    .select("id", { count: "exact", head: true });

  const newClientsQuery = applyRangeFilter(
    supabase.from("clients").select("id", { count: "exact", head: true }),
    "created_at",
    startIso,
    endIso,
  );
  const newPetsQuery = applyRangeFilter(
    supabase.from("pets").select("id", { count: "exact", head: true }),
    "created_at",
    startIso,
    endIso,
  );
  const completedQuery = applyRangeFilter(
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("status", ["Completed", "completed"]),
    "start_time",
    startIso,
    endIso,
  );
  const canceledQuery = applyRangeFilter(
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("status", ["Cancelled", "Canceled", "cancelled", "canceled"]),
    "start_time",
    startIso,
    endIso,
  );
  const noShowQuery = applyRangeFilter(
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("status", ["No show", "No-show", "no_show", "no-show"]),
    "start_time",
    startIso,
    endIso,
  );
  const revenueQuery = applyRangeFilter(
    supabase
      .from("appointments")
      .select("sum:price", { head: false })
      .in("status", ["Completed", "completed"]),
    "start_time",
    startIso,
    endIso,
  );
  const expectedRevenueQuery = applyRangeFilter(
    supabase.from("appointments").select("sum:price", { head: false }),
    "start_time",
    startIso,
    endIso,
  );
  const salesQuery = applyRangeFilter(
    supabase.from("payments").select("sum:amount", { head: false }),
    "created_at",
    startIso,
    endIso,
  );
  const topServicesQuery = applyRangeFilter(
    supabase
      .from("appointments")
      .select("service, usage_count:count(id)", { head: false })
      .not("service", "is", null),
    "start_time",
    startIso,
    endIso,
  )
    .order("usage_count", { ascending: false })
    .limit(3);

  const [
    clientsResult,
    petsResult,
    employeesResult,
    appointmentsResult,
    newClientsResult,
    newPetsResult,
    completedResult,
    canceledResult,
    noShowResult,
    revenueResult,
    expectedRevenueResult,
    salesResult,
    topServicesResult,
  ] = await Promise.all([
    clientsQuery,
    petsQuery,
    employeesQuery,
    appointmentsQuery,
    newClientsQuery,
    newPetsQuery,
    completedQuery,
    canceledQuery,
    noShowQuery,
    revenueQuery.maybeSingle(),
    expectedRevenueQuery.maybeSingle(),
    salesQuery.maybeSingle(),
    topServicesQuery,
  ]);

  const firstError =
    clientsResult.error ||
    petsResult.error ||
    employeesResult.error ||
    appointmentsResult.error ||
    newClientsResult.error ||
    newPetsResult.error ||
    completedResult.error ||
    canceledResult.error ||
    noShowResult.error ||
    revenueResult.error ||
    expectedRevenueResult.error ||
    salesResult.error ||
    topServicesResult.error ||
    null;

  const counts: Counts = {
    clients: clientsResult.count ?? 0,
    newClients: newClientsResult.count ?? 0,
    pets: petsResult.count ?? 0,
    newPets: newPetsResult.count ?? 0,
    employees: employeesResult.count ?? 0,
    appointments: appointmentsResult.count ?? 0,
    completed: completedResult.count ?? 0,
    canceled: canceledResult.count ?? 0,
    noShow: noShowResult.count ?? 0,
    revenue: toNumber((revenueResult.data as { sum: number | string | null } | null)?.sum ?? 0),
    expectedRevenue: toNumber(
      (expectedRevenueResult.data as { sum: number | string | null } | null)?.sum ?? 0,
    ),
    sales: toNumber((salesResult.data as { sum: number | string | null } | null)?.sum ?? 0),
    topServices: (topServicesResult.data ?? [])
      .map((row: any) => [row.service ?? "Other", toNumber(row.usage_count)] as [string, number])
      .filter(([, usage]) => usage > 0),
  };

  return (
    <PageContainer>
      <Card className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-primary-dark">Reports</h1>
          <RangeSelect value={range} options={rangeOptions} />
        </div>

        {firstError && (
          <div className="rounded-2xl border border-red-300/40 bg-red-100/40 px-4 py-3 text-sm text-red-700">
            Failed to load reports: {firstError.message}
          </div>
        )}

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
            <ReportCard title="Revenue" value={currencyFormatter.format(counts.revenue)} />
            <ReportCard
              title="Expected Revenue"
              value={currencyFormatter.format(counts.expectedRevenue)}
            />
            <ReportCard title="Sales" value={currencyFormatter.format(counts.sales)} />
          </div>
          <Card>
            <h2 className="mb-2 text-xl font-semibold">Top Services</h2>
            {counts.topServices.length === 0 ? (
              <p className="text-sm text-gray-500">No services found</p>
            ) : (
              <ul className="text-sm">
                {counts.topServices.map(([service, usage]) => (
                  <li key={service} className="flex justify-between border-b py-1 last:border-none">
                    <span>{service}</span>
                    <span className="font-medium">{usage}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </Card>
    </PageContainer>
  );
}

function ReportCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="text-center">
      <div className="mb-1 text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </Card>
  );
}
