"use client";
import { deleteRow } from "./actions";

// Bouton corbeille avec confirmation, relié à la Server Action deleteRow.
export default function DeleteButton({ table, id, label }: { table: string; id: number; label?: string }) {
  return (
    <form
      action={deleteRow}
      onSubmit={(e) => {
        const what = label ? `« ${label} »` : "cette entrée";
        if (!confirm(`Supprimer ${what} ? Cette action est définitive.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Supprimer"
        title="Supprimer"
        className="text-gray-300 hover:text-red-600 transition-colors p-1"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    </form>
  );
}
