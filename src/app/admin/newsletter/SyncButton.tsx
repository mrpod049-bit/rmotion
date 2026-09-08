"use client";
import { useActionState } from "react";
import { syncNewsletterToBrevo } from "./actions";

// Bouton « Synchroniser avec Brevo » relié à la Server Action. Affiche l'état
// (en cours / résultat) et rafraîchit la page (revalidatePath dans l'action).
export default function SyncButton() {
  const [state, formAction, pending] = useActionState(syncNewsletterToBrevo, null);

  return (
    <div className="flex items-center gap-3">
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "Synchronisation…" : "Synchroniser avec Brevo"}
        </button>
      </form>
      {state?.done && (
        <span className="text-sm text-gray-600">
          {state.attempted === 0
            ? "Déjà à jour ✓"
            : `${state.ok} synchronisé(s)${state.failed ? ` · ${state.failed} échec(s)` : ""}`}
        </span>
      )}
    </div>
  );
}
