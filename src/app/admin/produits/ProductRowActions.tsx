"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMachine, togglePublished } from "./actions";

export default function ProductRowActions({
  id,
  name,
  published,
}: {
  id: number;
  name: string;
  published: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  const onToggle = () =>
    start(async () => {
      await togglePublished(id, !published);
      router.refresh();
    });

  const onDelete = () =>
    start(async () => {
      if (!confirm(`Supprimer définitivement la fiche « ${name} » ? Cette action est irréversible.`)) return;
      const res = await deleteMachine(id);
      if (!res.ok) setErr(res.error || "Échec");
      else router.refresh();
    });

  return (
    <div className="flex items-center gap-3 justify-end">
      <Link href={`/admin/produits/${id}`} className="text-blue-600 hover:underline">Modifier</Link>
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        className={`hover:underline disabled:opacity-50 ${published ? "text-gray-500" : "text-emerald-700"}`}
      >
        {published ? "Dépublier" : "Publier"}
      </button>
      <button type="button" onClick={onDelete} disabled={pending} className="text-red-600 hover:underline disabled:opacity-50">
        Supprimer
      </button>
      {err && <span className="text-red-500 text-xs">{err}</span>}
    </div>
  );
}
