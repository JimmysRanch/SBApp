"use client";
import Card from "@/components/Card";
export default function PayrollWidget({ employeeId }: { employeeId: number }) {
  return (
    <Card>
      <h3 className="text-lg font-semibold">Payroll</h3>
      <p className="mt-3 text-sm text-gray-600">Payroll summary coming soon.</p>
    </Card>
  );
}
