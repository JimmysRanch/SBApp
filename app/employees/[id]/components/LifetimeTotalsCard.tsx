import Card from "@/components/Card";

type Props = { employeeId: string };

export default function LifetimeTotalsCard({ employeeId }: Props) {
  return (
    <Card>
      <h2 className="mb-2 text-lg font-semibold">Lifetime Totals</h2>
      <p>Placeholder totals for {employeeId}</p>
    </Card>
  );
}
