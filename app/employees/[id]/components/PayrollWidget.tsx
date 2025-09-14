import Widget from "@/components/Widget";

type Props = { employeeId: string };

export default function PayrollWidget({ employeeId }: Props) {
  return (
    <Widget title="Payroll" color="pink">
      <p>Payroll summary coming soon</p>
    </Widget>
  );
}
