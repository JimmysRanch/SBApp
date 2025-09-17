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
      <div className="absolute inset-0 bg-black/40" onClick={onCancel}></div>
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-80">
        <h2 className="text-lg font-semibold mb-3">Confirm Deletion</h2>
        <p className="text-sm text-gray-700 mb-6">Delete {itemName || "this appointment"}?</p>
        <div className="flex justify-end">
          <button onClick={onCancel} className="bg-gray-300 text-gray-800 px-4 py-2 rounded mr-3 hover:bg-gray-400">Cancel</button>
          <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}
