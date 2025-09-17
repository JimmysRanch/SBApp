import { createServerClient } from "@/lib/supabase/server";
import { addShift, deleteShift, requestTimeOff, setTimeOffStatus } from "./server-actions";

interface StaffScheduleProps {
  params: { id: string };
}

export default async function StaffSchedule({ params }: StaffScheduleProps) {
  const supabase = createServerClient();
  const staffId = Number(params.id);

  const [shiftsResult, timeOffResult] = await Promise.all([
    supabase.from("staff_shifts").select("*").eq("employee_id", staffId).order("starts_at"),
    supabase.from("staff_time_off").select("*").eq("employee_id", staffId).order("starts_at"),
  ]);

  const shifts = shiftsResult.data ?? [];
  const timeOff = timeOffResult.data ?? [];

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-2 font-semibold">Shifts</h3>
        <form action={addShift} className="flex flex-wrap gap-2">
          <input type="hidden" name="employee_id" value={staffId} />
          <input className="border p-2" type="datetime-local" name="starts_at" required />
          <input className="border p-2" type="datetime-local" name="ends_at" required />
          <input className="border p-2" type="text" name="note" placeholder="Note" />
          <button className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-neutral-50">Add Shift</button>
        </form>
        <ul className="mt-3 divide-y">
          {shifts.map((shift) => (
            <li key={shift.id} className="flex justify-between py-2">
              <span>
                {shift.starts_at ? new Date(shift.starts_at).toLocaleString() : ""} →
                {shift.ends_at ? ` ${new Date(shift.ends_at).toLocaleString()}` : ""}
                {shift.note ? ` · ${shift.note}` : ""}
              </span>
              <form action={deleteShift}>
                <input type="hidden" name="id" value={shift.id} />
                <button className="text-red-600">Delete</button>
              </form>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-2 font-semibold">Time Off</h3>
        <form action={requestTimeOff} className="flex flex-wrap gap-2">
          <input type="hidden" name="employee_id" value={staffId} />
          <input className="border p-2" type="datetime-local" name="starts_at" required />
          <input className="border p-2" type="datetime-local" name="ends_at" required />
          <input className="border p-2" type="text" name="reason" placeholder="Reason" />
          <button className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-neutral-50">Request</button>
        </form>
        <ul className="mt-3 divide-y">
          {timeOff.map((request) => (
            <li key={request.id} className="flex items-center justify-between py-2">
              <span>
                {request.starts_at ? new Date(request.starts_at).toLocaleString() : ""} →
                {request.ends_at ? ` ${new Date(request.ends_at).toLocaleString()}` : ""} · {request.reason} · {request.status}
              </span>
              <div className="flex gap-2">
                <form action={setTimeOffStatus}>
                  <input type="hidden" name="id" value={request.id} />
                  <input type="hidden" name="status" value="approved" />
                  <button className="text-green-600">Approve</button>
                </form>
                <form action={setTimeOffStatus}>
                  <input type="hidden" name="id" value={request.id} />
                  <input type="hidden" name="status" value="denied" />
                  <button className="text-red-600">Deny</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
