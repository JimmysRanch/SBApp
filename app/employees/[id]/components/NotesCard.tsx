import Card from "@/components/Card";

type Props = { employeeId: string };

export default function NotesCard({ employeeId }: Props) {
  return (
    <Card>
      <h2 className="mb-2 text-lg font-semibold">Notes</h2>
      <p>Sample note for {employeeId}</p>
    </Card>
  );
}
