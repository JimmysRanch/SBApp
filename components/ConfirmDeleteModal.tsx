"use client";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  itemName?: string;
}
export default function ConfirmDeleteModal({ open, onConfirm, onCancel, itemName }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgba(4,6,12,0.7)] backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative glass-panel w-80 rounded-3xl p-6">
        <h2 className="mb-3 text-lg font-semibold text-brand-navy">Confirm Deletion</h2>
        <p className="mb-6 text-sm text-brand-navy/70">Delete {itemName || "this appointment"}?</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-full bg-[linear-gradient(135deg,rgba(18,28,48,0.85),rgba(56,242,255,0.16))] px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-[linear-gradient(135deg,rgba(18,28,48,0.9),rgba(56,242,255,0.22))]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-[linear-gradient(135deg,rgba(220,38,38,0.7),rgba(244,63,94,0.6))] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_-18px_rgba(248,113,113,0.7)] transition hover:bg-[linear-gradient(135deg,rgba(220,38,38,0.82),rgba(244,63,94,0.7))]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
