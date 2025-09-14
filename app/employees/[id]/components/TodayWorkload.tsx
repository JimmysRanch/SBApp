import Widget from "@/components/Widget";

type Props = { employeeId: string };

export default function TodayWorkload({ employeeId }: Props) {
  return (
    <Widget title="Today's Workload">
      <p>Static workload for {employeeId}</p>
    </Widget>
  );
}
