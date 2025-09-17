"use client";
export default function DeleteConfirm({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-sm rounded shadow p-4 space-y-3">
        <div className="text-lg font-semibold">Delete event?</div>
        <p className="text-sm">This action cannot be undone.</p>
        <div className="flex justify-end space-x-2">
          <button className="border px-3 py-1 rounded" onClick={onClose}>Cancel</button>
          <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
