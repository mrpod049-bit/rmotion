"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Stage, Lead } from "@/lib/crm";
import { moveLead, createLead } from "./actions";

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default function PipelineBoard({
  stages,
  leads: initialLeads,
}: {
  stages: Stage[];
  leads: Lead[];
}) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overStage, setOverStage] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  function onDrop(stageId: number) {
    setOverStage(null);
    const id = dragId;
    setDragId(null);
    if (id == null) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.stage_id === stageId) return;

    // Mise à jour optimiste : on bouge la carte tout de suite.
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage_id: stageId } : l))
    );
    startTransition(async () => {
      await moveLead(id, stageId);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Pipeline commercial</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700"
        >
          + Nouvelle opportunité
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const col = leads.filter((l) => l.stage_id === stage.id);
          const total = col.reduce((s, l) => s + (Number(l.revenue) || 0), 0);
          const isOver = overStage === stage.id;
          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage.id);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
              onDrop={() => onDrop(stage.id)}
              className={`shrink-0 w-72 rounded-lg border p-3 transition-colors ${
                isOver
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-baseline justify-between mb-3 px-1">
                <span className="font-medium text-sm flex items-center gap-2">
                  {stage.is_won && <span className="text-green-600">★</span>}
                  {stage.name}
                  <span className="text-gray-400 font-normal">({col.length})</span>
                </span>
                <span className="text-xs text-gray-500">{eur.format(total)}</span>
              </div>

              <div className="flex flex-col gap-2 min-h-[60px]">
                {col.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/admin/crm/${lead.id}`}
                    draggable
                    onDragStart={() => setDragId(lead.id)}
                    onDragEnd={() => setDragId(null)}
                    className={`block rounded-md border border-gray-200 bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-300 ${
                      dragId === lead.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="text-sm font-medium leading-snug">
                      {lead.name}
                    </div>
                    {(lead.company_name || lead.contact_name) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {lead.company_name || lead.contact_name}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium text-gray-700">
                        {eur.format(Number(lead.revenue) || 0)}
                      </span>
                      {lead.probability > 0 && (
                        <span className="text-[11px] text-gray-400">
                          {lead.probability}%
                        </span>
                      )}
                    </div>
                    {lead.line_count > 0 && (
                      <div className="text-[11px] text-green-700 mt-0.5">
                        marge {eur.format(Number(lead.margin) || 0)}
                      </div>
                    )}
                  </Link>
                ))}
                {col.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">
                    Déposez une carte ici
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <NewLeadForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function NewLeadForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await createLead({
        name: String(fd.get("name") || ""),
        company_name: String(fd.get("company_name") || ""),
        contact_name: String(fd.get("contact_name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        expected_revenue: Number(fd.get("expected_revenue") || 0),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Nouvelle opportunité</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Intitulé de l&apos;opportunité *
            </label>
            <input name="name" required autoFocus className={input}
              placeholder="Ex. OL Series pour Atelier Martin" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Société</label>
              <input name="company_name" className={input} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Contact</label>
              <input name="contact_name" className={input} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input name="email" type="email" className={input} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
              <input name="phone" className={input} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Montant potentiel (€)
            </label>
            <input name="expected_revenue" type="number" min="0" step="100"
              defaultValue={0} className={input} />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Création…" : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}
