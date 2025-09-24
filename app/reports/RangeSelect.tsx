"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, type ChangeEvent } from "react";

type RangeOption = "today" | "week" | "month" | "year" | "all";

type Props = {
  value: RangeOption;
  options: readonly { value: RangeOption; label: string }[];
};

export default function RangeSelect({ value, options }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextValue = event.target.value as RangeOption;
    const current = new URLSearchParams(searchParams.toString());

    if (nextValue === "today") {
      current.delete("range");
    } else {
      current.set("range", nextValue);
    }

    const query = current.toString();
    startTransition(() => {
      router.replace(query ? `/reports?${query}` : "/reports");
    });
  };

  return (
    <label className="flex items-center gap-2 text-sm font-medium text-brand-navy">
      <span>Date range:</span>
      <select
        value={value}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-full border border-gray-300 px-3 py-2 text-sm"
        aria-label="Select date range"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
