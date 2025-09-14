import Widget from "@/components/Widget";

type Props = { employeeId: string };

export default function WeekScheduleWidget({ employeeId }: Props) {
  return (
    <Widget title="Week Schedule" color="green">
      <p>Static schedule for {employeeId}</p>
    </Widget>
  );
}
