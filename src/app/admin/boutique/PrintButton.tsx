"use client";
export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700">
      Imprimer / Enregistrer en PDF
    </button>
  );
}
