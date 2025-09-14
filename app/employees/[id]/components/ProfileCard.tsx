import Card from "@/components/Card";

type Props = {
  employeeId: string;
  name: string;
  active: boolean | null;
};

export default function ProfileCard({ employeeId, name, active }: Props) {
  return (
    <Card>
      <h2 className="mb-2 text-xl font-semibold">Profile</h2>
      <p>ID: {employeeId}</p>
      <p>Name: {name}</p>
      <p>Status: {active ? "Active" : "Inactive"}</p>
    </Card>
  );
}
