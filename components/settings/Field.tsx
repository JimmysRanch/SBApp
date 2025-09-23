"use client";
import React from "react";
type Props = {
  label: string;
  hint?: string;
  onReset?: () => void;
  children: (helpers: { id: string; labelId: string; hintId?: string }) => React.ReactNode;
};
export function Field({ label, hint, children, onReset }: Props) {
  const uid = React.useId();
  const controlId = `${uid}-control`;
  const labelId = `${uid}-label`;
  const hintId = hint ? `${uid}-hint` : undefined;
  return (
    <div className="border border-gray-200 rounded-lg p-3 mb-3">
      <div className="flex items-baseline justify-between">
        <label htmlFor={controlId} id={labelId} className="font-semibold">
          {label}
        </label>
        {onReset && <button onClick={onReset} aria-label="Reset" className="text-sm">Reset</button>}
      </div>
      {hint && <div id={hintId} className="text-xs text-gray-500 mb-1.5">{hint}</div>}
      <div role="group" aria-labelledby={labelId}>
        {children({ id: controlId, labelId, hintId })}
      </div>
    </div>
  );
}
