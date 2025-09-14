export default function EmployeeSchedulePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Schedule for employee {params.id}</h1>
      <p>Calendar editor coming soon.</p>
    </div>
  );
}
