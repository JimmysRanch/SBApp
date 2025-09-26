"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import PageContainer from "@/components/PageContainer";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { canManageWorkspace, derivePermissionFlags } from "@/lib/auth/roles";
import { normaliseRole, type Role } from "@/lib/auth/profile";
import { readMoney } from "./data-helpers";

import StaffHeader from "./components/StaffHeader";
import StaffTabs from "./components/StaffTabs";

export type StaffRecord = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  user_id?: string | null;
  role: Role | null;
  avatar_url: string | null;
  active: boolean | null;
  status?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  pay_type?: string | null;
  commission_rate?: number | null;
  hourly_rate?: number | null;
  salary_rate?: number | null;
  compensation_plan?: Record<string, unknown> | null;
  app_permissions?: Record<string, unknown> | null;
  preferred_breeds?: string[] | null;
  not_accepted_breeds?: string[] | null;
  specialties?: string[] | null;
  manager_notes?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
};

export type StaffGoals = {
  weekly_revenue_target: number | null;
  desired_dogs_per_day: number | null;
};

export type ViewerRecord = {
  id: number;
  name: string | null;
  role: Role | null;
  app_permissions: Record<string, unknown> | null;
};

export type AppointmentDiscount = {
  id: number;
  appointment_id?: string;
  amount: number;
  reason: string;
  created_at?: string;
  created_by?: number | null;
};

export type AppointmentDetail = {
  id: string;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  service: string | null;
  service_id?: string | null;
  price: number | null;
  notes: string | null;
  vaccine_flag?: boolean | null;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  pet_name?: string | null;
  pet_breed?: string | null;
  services?: string[];
  photos?: { id: number; url: string }[];
  appointment_discounts?: AppointmentDiscount[];
};

type DiscountDraft = {
  appointmentId: string;
  amount: number;
  reason: string;
  discountId?: number | null;
};

type Toast = {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
};

type EmployeeDetailContextValue = {
  employee: StaffRecord;
  goals: StaffGoals | null;
  viewer: ViewerRecord | null;
  viewerCanManageDiscounts: boolean;
  viewerCanEditStaff: boolean;
  appointmentDetail: AppointmentDetail | null;
  appointmentLoading: boolean;
  refreshKey: number;
  openAppointmentDrawer: (appointmentId: string) => void;
  closeDrawer: () => void;
  openDiscountModal: (draft: DiscountDraft) => void;
  refreshAppointmentDetail: () => Promise<void>;
  pushToast: (message: string, tone?: Toast["tone"]) => void;
};

const EmployeeDetailContext = createContext<EmployeeDetailContextValue | null>(null);

function isTruthyFlag(value: unknown) {
  if (value === true) return true;
  if (value === false || value === null || value === undefined) return false;
  if (typeof value === "string") {
    const normalised = value.trim().toLowerCase();
    return ["true", "1", "yes", "y", "on"].includes(normalised);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value !== 0 : false;
  }
  return false;
}

export function useEmployeeDetail() {
  const ctx = useContext(EmployeeDetailContext);
  if (!ctx) {
    throw new Error("useEmployeeDetail must be used within EmployeeDetailClient");
  }
  return ctx;
}

const subtabs = [
  { label: "Overview", path: (id: number) => `/employees/${id}` },
  { label: "History", path: (id: number) => `/employees/${id}/history` },
  { label: "Payroll", path: (id: number) => `/employees/${id}/payroll` },
  { label: "Schedule", path: (id: number) => `/employees/${id}/schedule` },
  { label: "Settings", path: (id: number) => `/employees/${id}/settings` },
];

type Props = {
  children: ReactNode;
  employee: StaffRecord;
  goals: StaffGoals | null;
};

export default function EmployeeDetailClient({ children, employee, goals }: Props) {
  const router = useRouter();
  const { role, profile } = useAuth();
  const email = profile?.email ?? null;
  const permissions = useMemo(() => derivePermissionFlags(role), [role]);
  const isOwner = useMemo(() => canManageWorkspace(role), [role]);

  const [viewer, setViewer] = useState<ViewerRecord | null>(null);
  const [viewerLoaded, setViewerLoaded] = useState(false);
  useEffect(() => {
    let isActive = true;
    const loadViewer = async () => {
      if (!email) {
        if (isActive) {
          setViewer(null);
          setViewerLoaded(true);
        }
        return;
      }
      const { data, error } = await supabase
        .from("employees")
        .select("id,name,app_permissions,profile:profiles(role)")
        .eq("email", email)
        .maybeSingle();
      if (!isActive) return;
      if (!error && data) {
        const profileRole =
          (data as { profile?: { role?: string | null } | null })?.profile?.role ?? null;
        const resolvedRole = profileRole ? normaliseRole(profileRole) : null;
        setViewer({
          id: (data as { id: number }).id,
          name: (data as { name: string | null }).name ?? null,
          role: resolvedRole,
          app_permissions: (data as { app_permissions?: Record<string, unknown> | null }).app_permissions ?? null,
        });
      } else {
        setViewer(null);
      }
      setViewerLoaded(true);
    };
    loadViewer();
    return () => {
      isActive = false;
    };
  }, [email]);

  const [drawerAppointmentId, setDrawerAppointmentId] = useState<string | null>(null);
  const [appointmentDetail, setAppointmentDetail] = useState<AppointmentDetail | null>(null);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [discountDraft, setDiscountDraft] = useState<DiscountDraft | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const viewerCanManageDiscounts = useMemo(() => {
    if (permissions.canManageEmployees) return true;
    if (!viewer) return false;
    const perms = viewer.app_permissions ?? {};
    if (typeof perms === "object" && perms !== null) {
      const flags = perms as Record<string, unknown>;
      if (isTruthyFlag(flags.can_manage_discounts)) return true;
      if (isTruthyFlag(flags.is_manager)) return true;
    }
    const viewerRole = viewer.role;
    return viewerRole ? ["master", "admin", "senior_groomer"].includes(viewerRole) : false;
  }, [permissions, viewer]);

  const viewerCanEditStaff = useMemo(() => {
    if (permissions.canManageEmployees || isOwner) return true;
    if (!viewer) return false;
    const perms = viewer.app_permissions ?? {};
    if (typeof perms === "object" && perms !== null) {
      const flags = perms as Record<string, unknown>;
      if (isTruthyFlag(flags.can_manage_staff)) return true;
      if (isTruthyFlag(flags.can_edit_schedule)) return true;
      if (isTruthyFlag(flags.can_manage_discounts)) return true;
      if (isTruthyFlag(flags.can_view_reports)) return true;
      if (isTruthyFlag(flags.is_manager)) return true;
    }
    const viewerRole = viewer.role;
    return viewerRole ? ["master", "admin", "senior_groomer"].includes(viewerRole) : false;
  }, [isOwner, permissions, viewer]);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, tone }]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3200);
    return () => clearTimeout(timer);
  }, [toasts]);

  const fetchAppointmentDetail = useCallback(async () => {
    if (!drawerAppointmentId) return;
    setAppointmentLoading(true);
    try {
      const baseSelect =
        "id,start_time,end_time,starts_at,ends_at,status,notes,note,service,service_id,service_name,price,price_cents,price_amount,price_amount_cents,owner_name,owner_email,owner_phone,pet_name,pet_breed,client_id,pet_id,services(name),clients:client_id(first_name,last_name,full_name,email,phone),pets:pet_id(name,breed),appointment_add_ons(add_on:add_ons(name))";

      let record: any = null;
      const { data, error } = await supabase
        .from("appointments")
        .select(baseSelect)
        .eq("id", drawerAppointmentId)
        .maybeSingle();

      if (error || !data) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("appointments")
          .select("*")
          .eq("id", drawerAppointmentId)
          .maybeSingle();
        if (fallbackError || !fallbackData) {
          pushToast("Unable to load appointment", "error");
          setAppointmentDetail(null);
          setAppointmentLoading(false);
          return;
        }
        record = fallbackData;
      } else {
        record = data;
      }

      const normaliseIso = (value: unknown): string | null => {
        if (!value) return null;
        if (typeof value === "string") return value;
        if (value instanceof Date) return value.toISOString();
        if (typeof value === "number") {
          const parsed = new Date(value);
          return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
        }
        return String(value);
      };

      const serviceNameDirect =
        typeof record.service === "string" && record.service.trim().length > 0
          ? record.service.trim()
          : "";
      const serviceNameFallbackField =
        typeof record.service_name === "string" && record.service_name.trim().length > 0
          ? record.service_name.trim()
          : "";
      const serviceNameFromRelation =
        record.services &&
        typeof record.services === "object" &&
        typeof record.services?.name === "string" &&
        record.services.name.trim().length > 0
          ? record.services.name.trim()
          : "";
      const serviceName =
        serviceNameDirect || serviceNameFallbackField || serviceNameFromRelation || null;

      const clientRecord =
        record.clients ?? record.client ?? record.customer ?? record.owner ?? null;
      const fullNameFromField =
        clientRecord &&
        typeof clientRecord.full_name === "string" &&
        clientRecord.full_name.trim().length > 0
          ? clientRecord.full_name.trim()
          : "";
      const concatenatedName = [clientRecord?.first_name, clientRecord?.last_name]
        .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
        .map((part) => part.trim())
        .join(" ")
        .trim();
      const clientFullName = fullNameFromField || concatenatedName || null;

      const petRecord = record.pets ?? record.pet ?? null;
      const addOnNames = Array.isArray(record.appointment_add_ons)
        ? (record.appointment_add_ons as any[])
            .map((item) => {
              if (!item) return null;
              const source = item.add_on ?? item.addOn ?? item;
              return typeof source?.name === "string" && source.name.trim().length > 0
                ? source.name.trim()
                : null;
            })
            .filter((name): name is string => Boolean(name))
        : [];

      const detail: AppointmentDetail = {
        id: record.id ? String(record.id) : drawerAppointmentId,
        start_time: normaliseIso(
          record.start_time ?? record.starts_at ?? record.start ?? record.scheduled_at ?? record.start_date ?? record.date ?? null
        ),
        end_time: normaliseIso(record.end_time ?? record.ends_at ?? record.end ?? record.ends_on ?? null),
        status: record.status ?? null,
        service: serviceName ?? null,
        service_id: record.service_id ? String(record.service_id) : null,
        price: readMoney(record, ["price", "price_cents", "price_amount", "price_amount_cents"]),
        notes: record.notes ?? record.note ?? null,
        vaccine_flag: record.vaccine_flag ?? record.requires_vaccine ?? null,
        owner_name: record.owner_name ?? clientFullName ?? null,
        owner_email: record.owner_email ?? clientRecord?.email ?? null,
        owner_phone: record.owner_phone ?? clientRecord?.phone ?? null,
        pet_name:
          (typeof record.pet_name === "string" && record.pet_name.trim().length > 0 ? record.pet_name.trim() : null) ??
          (petRecord && typeof petRecord.name === "string" ? petRecord.name : null),
        pet_breed:
          (typeof record.pet_breed === "string" && record.pet_breed.trim().length > 0 ? record.pet_breed.trim() : null) ??
          (petRecord && typeof petRecord.breed === "string" ? petRecord.breed : null),
        services: [serviceName, ...addOnNames].filter((name): name is string => Boolean(name)),
      };

      if (!detail.owner_name && record.client_id) {
        const { data: client } = await supabase
          .from("clients")
          .select("first_name,last_name,full_name,email,phone")
          .eq("id", record.client_id)
          .maybeSingle();
        if (client) {
          const fallbackName =
            (typeof client.full_name === "string" && client.full_name.trim().length > 0
              ? client.full_name.trim()
              : null) ??
            [client.first_name, client.last_name].filter(Boolean).join(" ").trim();
          detail.owner_name = fallbackName || detail.owner_name;
          detail.owner_email = client.email ?? detail.owner_email ?? null;
          detail.owner_phone = client.phone ?? detail.owner_phone ?? null;
        }
      }

      if (!detail.pet_name && record.pet_id) {
        const { data: pet } = await supabase
          .from("pets")
          .select("name,breed")
          .eq("id", record.pet_id)
          .maybeSingle();
        if (pet) {
          detail.pet_name = pet.name ?? detail.pet_name ?? null;
          detail.pet_breed = pet.breed ?? detail.pet_breed ?? null;
        }
      }

      const { data: discounts } = await supabase
        .from("appointment_discounts")
        .select("id,amount,amount_cents,reason,created_at,created_by,appointment_id")
        .eq("appointment_id", drawerAppointmentId)
        .order("created_at", { ascending: true });
      detail.appointment_discounts = Array.isArray(discounts)
        ? (discounts as any[]).map((discount) => ({
            id: discount.id,
            appointment_id: discount.appointment_id ? String(discount.appointment_id) : drawerAppointmentId,
            amount: readMoney(discount, ["amount", "amount_cents"]) ?? 0,
            reason: discount.reason ?? "",
            created_at: discount.created_at ?? null,
            created_by: discount.created_by ?? null,
          }))
        : [];

      try {
        const { data: photos } = await supabase
          .from("appointment_photos")
          .select("id,url")
          .eq("appointment_id", drawerAppointmentId)
          .order("created_at", { ascending: true });
        if (Array.isArray(photos)) {
          detail.photos = photos as { id: number; url: string }[];
        }
      } catch (err) {
        // optional table; ignore errors
      }

      setAppointmentDetail(detail);
    } finally {
      setAppointmentLoading(false);
    }
  }, [drawerAppointmentId, pushToast]);

  useEffect(() => {
    if (drawerAppointmentId) {
      setDrawerOpen(true);
      fetchAppointmentDetail();
    } else {
      setDrawerOpen(false);
      setAppointmentDetail(null);
    }
  }, [drawerAppointmentId, fetchAppointmentDetail]);

  const openAppointmentDrawer = useCallback((appointmentId: string) => {
    setDrawerAppointmentId(appointmentId);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerAppointmentId(null);
    setAppointmentDetail(null);
    setDrawerOpen(false);
  }, []);

  const openDiscountModal = useCallback((draft: DiscountDraft) => {
    setDiscountDraft(draft);
  }, []);

  const tabs = useMemo(
    () =>
      subtabs.map((tab) => ({
        label: tab.label,
        href: tab.path(employee.id),
      })),
    [employee.id]
  );

  const sanitizePhone = (value: string | null) => {
    if (!value) return "";
    return value.replace(/[^0-9+]/g, "");
  };

  const handleCallClick = () => {
    if (!employee.phone) {
      pushToast("No phone number on file", "error");
      return;
    }
    window.open(`tel:${sanitizePhone(employee.phone)}`);
  };

  const handleTextClick = () => {
    if (!employee.phone) {
      pushToast("No phone number on file", "error");
      return;
    }
    window.open(`sms:${sanitizePhone(employee.phone)}`);
  };

  const handleEmailClick = () => {
    if (!employee.email) {
      pushToast("No email address on file", "error");
      return;
    }
    window.open(`mailto:${employee.email}`);
  };

  return (
    <EmployeeDetailContext.Provider
      value={{
        employee,
        goals,
        viewer: viewerLoaded ? viewer : null,
        viewerCanManageDiscounts,
        viewerCanEditStaff,
        appointmentDetail,
        appointmentLoading,
        refreshKey,
        openAppointmentDrawer,
        closeDrawer,
        openDiscountModal,
        refreshAppointmentDetail: fetchAppointmentDetail,
        pushToast,
      }}
    >
      <PageContainer className="space-y-6 text-brand-navy">
        <div className="space-y-4">
          <StaffHeader
            onCall={handleCallClick}
            onText={handleTextClick}
            onEmail={handleEmailClick}
          />
          <StaffTabs tabs={tabs} />
        </div>
        <div className="space-y-6">{children}</div>
      </PageContainer>
      <AppointmentDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        isManager={viewerCanManageDiscounts}
        onEditDiscount={() => {
          if (!appointmentDetail) return;
          const existing = appointmentDetail.appointment_discounts?.[appointmentDetail.appointment_discounts.length - 1];
          openDiscountModal({
            appointmentId: appointmentDetail.id,
            amount: existing?.amount ?? 0,
            reason: existing?.reason ?? "",
            discountId: existing?.id ?? null,
          });
        }}
        onAddDiscount={() => {
          if (!appointmentDetail) return;
          openDiscountModal({ appointmentId: appointmentDetail.id, amount: 0, reason: "" });
        }}
      />
      <DiscountModal
        draft={discountDraft}
        onClose={() => setDiscountDraft(null)}
        onSaved={() => {
          setDiscountDraft(null);
          fetchAppointmentDetail();
          setRefreshKey((value) => value + 1);
        }}
        viewerId={viewer?.id ?? null}
        pushToast={pushToast}
      />
      <ToastContainer toasts={toasts} />
    </EmployeeDetailContext.Provider>
  );
}

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  isManager: boolean;
  onAddDiscount: () => void;
  onEditDiscount: () => void;
};

function AppointmentDrawer({ open, onClose, isManager, onAddDiscount, onEditDiscount }: DrawerProps) {
  const { appointmentDetail, appointmentLoading, pushToast, refreshAppointmentDetail } = useEmployeeDetail();
  const router = useRouter();

  const gotoCalendar = () => {
    if (!appointmentDetail) return;
    onClose();
    router.push(`/calendar?appointmentId=${appointmentDetail.id}`);
  };

  const gotoInvoice = () => {
    if (!appointmentDetail) return;
    if ("invoice_id" in appointmentDetail && appointmentDetail.invoice_id) {
      onClose();
      router.push(`/payments/invoices/${(appointmentDetail as any).invoice_id}`);
    } else {
      pushToast("No invoice connected to this appointment", "info");
    }
  };

  const discounts = appointmentDetail?.appointment_discounts ?? [];
  const hasDiscounts = discounts.length > 0;

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-end bg-black/30 transition-opacity",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
      aria-hidden={!open}
    >
      <div
        className={clsx(
          "h-full w-full max-w-lg transform bg-white p-6 shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-brand-navy">Appointment Details</h2>
            {appointmentDetail?.start_time && (
              <p className="text-sm text-slate-500">
                {new Date(appointmentDetail.start_time).toLocaleString()}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {appointmentLoading && (
          <div className="mt-6 space-y-4">
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine />
          </div>
        )}

        {!appointmentLoading && appointmentDetail && (
          <div className="mt-6 space-y-6 text-sm text-slate-700">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</h3>
              <div>{appointmentDetail.owner_name ?? "—"}</div>
              <div className="text-xs text-slate-500">
                {[appointmentDetail.owner_email, appointmentDetail.owner_phone]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pet</h3>
                <div>{appointmentDetail.pet_name ?? "—"}</div>
                {appointmentDetail.pet_breed && (
                  <div className="text-xs text-slate-500">{appointmentDetail.pet_breed}</div>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Services</h3>
                <div>{appointmentDetail.services?.join(", ") || appointmentDetail.service || "—"}</div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</h3>
                <div className="font-semibold text-brand-navy">
                  {typeof appointmentDetail.price === "number"
                    ? `$${appointmentDetail.price.toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</h3>
                <div className="capitalize">{appointmentDetail.status ?? "—"}</div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</h3>
                <div>
                  {appointmentDetail.start_time
                    ? new Date(appointmentDetail.start_time).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "—"}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">End</h3>
                <div>
                  {appointmentDetail.end_time
                    ? new Date(appointmentDetail.end_time).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "—"}
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</h3>
              <div className="mt-1 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                {appointmentDetail.notes?.trim() ? appointmentDetail.notes : "No notes on file."}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vaccines</h3>
                <div>{appointmentDetail.vaccine_flag ? "Updated" : "Missing"}</div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Photos</h3>
                <div className="flex flex-wrap gap-2">
                  {appointmentDetail.photos?.length ? (
                    appointmentDetail.photos.map((photo) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={photo.id}
                        src={photo.url}
                        alt="Appointment"
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ))
                  ) : (
                    <span className="text-slate-500">No photos</span>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Discounts</h3>
                {isManager && (
                  <button
                    type="button"
                    onClick={hasDiscounts ? onEditDiscount : onAddDiscount}
                    className="text-sm font-medium text-brand-blue hover:underline"
                  >
                    {hasDiscounts ? "Edit discount" : "Add discount"}
                  </button>
                )}
              </div>
              {hasDiscounts ? (
                <div className="space-y-2">
                  {discounts.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700"
                    >
                      <div className="font-semibold">- ${item.amount.toFixed(2)}</div>
                      <div className="text-xs uppercase tracking-wide text-emerald-600">{item.reason}</div>
                      {item.created_at && (
                        <div className="text-[10px] text-emerald-500">
                          Added {new Date(item.created_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  No discounts recorded.
                </div>
              )}
            </section>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={gotoCalendar}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-slate-100"
          >
            Open in Calendar
          </button>
          <button
            type="button"
            onClick={gotoInvoice}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-slate-100"
          >
            Open invoice
          </button>
          <button
            type="button"
            onClick={() => {
              refreshAppointmentDetail();
              pushToast("Appointment refreshed", "info");
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

type DiscountModalProps = {
  draft: DiscountDraft | null;
  onClose: () => void;
  onSaved: () => void;
  viewerId: number | null;
  pushToast: (message: string, tone?: Toast["tone"]) => void;
};

function DiscountModal({ draft, onClose, onSaved, viewerId, pushToast }: DiscountModalProps) {
  const [amount, setAmount] = useState<string>("0");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (draft) {
      setAmount((draft.amount ?? 0).toString());
      setReason(draft.reason ?? "");
    } else {
      setAmount("0");
      setReason("");
      setSaving(false);
    }
  }, [draft]);

  const handleSave = async () => {
    if (!draft) return;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      pushToast("Discount must be zero or greater", "error");
      return;
    }
    if (!reason.trim()) {
      pushToast("Reason is required", "error");
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      appointment_id: draft.appointmentId,
      amount: numericAmount,
      reason,
    };
    if (viewerId) {
      payload.created_by = viewerId;
    }

    let response;
    if (draft.discountId) {
      response = await supabase
        .from("appointment_discounts")
        .update(payload)
        .eq("id", draft.discountId);
    } else {
      response = await supabase.from("appointment_discounts").insert(payload);
    }

    if (response.error) {
      pushToast("Failed to save discount", "error");
      setSaving(false);
      return;
    }

    pushToast("Discount saved", "success");
    setSaving(false);
    onSaved();
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4",
        draft ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
      aria-hidden={!draft}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-navy">Add Discount</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Amount
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1 h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-hotpink px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-hotpink/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

type ToastContainerProps = {
  toasts: Toast[];
};

function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex flex-col items-center gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            "pointer-events-auto w-full max-w-md rounded-full px-5 py-3 text-sm font-medium shadow-lg",
            toast.tone === "success" && "bg-emerald-600 text-white",
            toast.tone === "error" && "bg-rose-600 text-white",
            toast.tone === "info" && "bg-brand-blue text-white"
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function SkeletonLine() {
  return <div className="h-4 animate-pulse rounded bg-slate-200" />;
}
