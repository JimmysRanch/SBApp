import Widget from "@/components/Widget";

type Props = { employeeId: string };

export default function AppointmentsList({ employeeId }: Props) {
  return (
    <Widget title="Appointments">
      <ul className="list-disc pl-5 text-sm text-gray-600">
        <li>Consultation - 9:00 AM</li>
        <li>Follow-up - 1:00 PM</li>
      </ul>
    </Widget>
  );
}
