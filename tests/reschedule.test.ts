import "tsconfig-paths/register";
process.env.TS_NODE_TRANSPILE_ONLY = "1";
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.test";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "service-role";

import { test } from "node:test";
import assert from "node:assert/strict";

const TOKEN = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SERVICE_ID = "11111111-1111-4111-8111-111111111111";
const STAFF_ID = "22222222-2222-4222-8222-222222222222";
const SLOT_START = new Date("2025-01-10T15:00:00.000Z");
const FIXED_NOW = new Date("2024-01-01T12:00:00.000Z");

type Row = Record<string, unknown> | null;

type AvailableSlotStub = {
  staffId: string;
  start: Date;
  end: Date;
};

interface StubConfig {
  link?: Row;
  appointment?: Row;
  updatedAppointment?: Row;
  appointmentError?: Error | null;
  updatedError?: Error | null;
  linkUpdateError?: Error | null;
  auditError?: Error | null;
}

interface StubState {
  appointmentUpdate?: Record<string, unknown>;
  linkUpdate?: Record<string, unknown>;
  auditPayload?: Record<string, unknown>;
}

function createSupabaseStub(config: StubConfig = {}) {
  const state: StubState = {};
  let appointmentCallCount = 0;

  const supabase = {
    from(table: string) {
      if (table === "reschedule_links") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async maybeSingle() {
            return { data: config.link ?? null, error: null };
          },
          update(values: Record<string, unknown>) {
            state.linkUpdate = values;
            return {
              eq() {
                return Promise.resolve({ error: config.linkUpdateError ?? null });
              },
            };
          },
        };
      }

      if (table === "appointments") {
        appointmentCallCount += 1;
        if (appointmentCallCount === 1) {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            async maybeSingle() {
              if (config.appointmentError) {
                return { data: null, error: config.appointmentError };
              }
              return { data: config.appointment ?? null, error: null };
            },
          };
        }
        return {
          update(values: Record<string, unknown>) {
            state.appointmentUpdate = values;
            return {
              eq() {
                return {
                  select() {
                    return {
                      async maybeSingle() {
                        if (config.updatedError) {
                          return { data: null, error: config.updatedError };
                        }
                        return { data: config.updatedAppointment ?? null, error: null };
                      },
                    };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "audit_log") {
        return {
          async insert(values: Record<string, unknown>) {
            state.auditPayload = values;
            return { error: config.auditError ?? null };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };

  return { supabase: supabase as unknown, state };
}

async function loadApplyRescheduleImpl() {
  const module = await import("../src/server/scheduling/links");
  return module.applyReschedule;
}

async function createApplyReschedule(
  config: StubConfig,
  slots: AvailableSlotStub[] | null,
) {
  const { supabase, state } = createSupabaseStub(config);
  const fixedNow = FIXED_NOW;

  async function listSlotsStub() {
    if (slots === null) {
      throw new Error("listSlots should not be called");
    }
    return slots;
  }

  const applyRescheduleImpl = await loadApplyRescheduleImpl();

  async function applyReschedule(input: Parameters<typeof applyRescheduleImpl>[0]) {
    return applyRescheduleImpl(input, {
      getSupabaseAdmin: () => supabase as any,
      listSlots: listSlotsStub,
      now: () => fixedNow,
    });
  }

  return { applyReschedule, state };
}

test("applyReschedule rejects unknown tokens", async (t) => {
  const { applyReschedule } = await createApplyReschedule({ link: null }, null);

  await assert.rejects(
    applyReschedule({
      token: TOKEN,
      newSlot: {
        serviceId: SERVICE_ID,
        startsAt: SLOT_START,
      },
    }),
    /Reschedule token not found/,
  );
});

test("applyReschedule rejects expired tokens", async (t) => {
  const expiredLink = {
    id: "link-1",
    appointment_id: "appt-1",
    token: TOKEN,
    expires_at: new Date(FIXED_NOW.getTime() - 1000).toISOString(),
    used_at: null,
  };
  const { applyReschedule } = await createApplyReschedule({ link: expiredLink }, null);

  await assert.rejects(
    applyReschedule({
      token: TOKEN,
      newSlot: {
        serviceId: SERVICE_ID,
        startsAt: SLOT_START,
      },
    }),
    /expired/i,
  );
});

test("applyReschedule updates appointment and marks token used", async (t) => {
  const linkRow = {
    id: "link-1",
    appointment_id: "appt-1",
    token: TOKEN,
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    used_at: null,
  };

  const appointmentRow = {
    id: "appt-1",
    staff_id: STAFF_ID,
    service_id: SERVICE_ID,
    starts_at: new Date("2025-01-02T10:00:00.000Z").toISOString(),
    ends_at: new Date("2025-01-02T11:30:00.000Z").toISOString(),
    created_by: "client-1",
    services: {
      id: SERVICE_ID,
      duration_min: 90,
      buffer_pre_min: 0,
      buffer_post_min: 0,
    },
  };

  const updatedRow = {
    id: "appt-1",
    staff_id: STAFF_ID,
    service_id: SERVICE_ID,
    starts_at: SLOT_START.toISOString(),
    ends_at: new Date(SLOT_START.getTime() + 90 * 60 * 1000).toISOString(),
  };

  const slots: AvailableSlotStub[] = [
    {
      staffId: STAFF_ID,
      start: new Date(SLOT_START),
      end: new Date(SLOT_START.getTime() + 90 * 60 * 1000),
    },
  ];

  const { applyReschedule, state } = await createApplyReschedule(
    { link: linkRow, appointment: appointmentRow, updatedAppointment: updatedRow },
    slots,
  );

  const result = await applyReschedule({
    token: TOKEN,
    newSlot: {
      serviceId: SERVICE_ID,
      staffId: STAFF_ID,
      startsAt: SLOT_START,
    },
  });

  assert.deepEqual(result, updatedRow, "Should return the updated appointment row");
  assert.ok(state.appointmentUpdate, "Appointment update payload should be captured");
  assert.equal(state.appointmentUpdate?.starts_at, SLOT_START.toISOString());
  assert.ok(state.linkUpdate, "Reschedule link should be marked used");
  assert.match(String(state.linkUpdate?.used_at), /T/);
  assert.ok(state.auditPayload, "Audit log entry should be created");
});
