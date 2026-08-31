"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateMachinePricing,
  createMachine,
  addMachineOption,
  updateMachineOption,
  deleteMachineOption,
} from "../actions";
import type { MachineRow, MachineOptionRow } from "./page";

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const inp =
  "w-28 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-blue-500 focus:outline-none";

export default function MachinePricingTable({ machines }: { machines: MachineRow[] }) {
  return (
    <div className="space-y-6">
      <AddMachineForm />
      <div className="space-y-3">
        {machines.map((m) => (
          <MachineCard key={m.id} machine={m} />
        ))}
      </div>
    </div>
  );
}

function AddMachineForm() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sale, setSale] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!name.trim()) {
      setError("Le nom est requis.");
      return;
    }
    startTransition(async () => {
      try {
        await createMachine({
          name,
          sale_price: sale === "" ? null : Number(sale),
          cost_price: cost === "" ? null : Number(cost),
        });
        setName(""); setSale(""); setCost(""); setError(null); setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      }
    });
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
        + Ajouter une machine
      </button>
    );

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Nom de la machine *</label>
          <input value={name} autoFocus onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Laser fibre 60W custom"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Prix de vente</label>
          <input value={sale} onChange={(e) => setSale(e.target.value)} type="number" min="0" step="100"
            placeholder="—" className={inp} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Coût import</label>
          <input value={cost} onChange={(e) => setCost(e.target.value)} type="number" min="0" step="100"
            placeholder="—" className={inp} />
        </div>
        <button onClick={submit}
          className="rounded-md bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
          Créer
        </button>
        <button onClick={() => { setOpen(false); setError(null); }}
          className="text-sm text-gray-500 px-2 py-2 hover:underline">
          Annuler
        </button>
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      <p className="text-xs text-gray-400 mt-2">
        Machine interne au CRM (non publiée sur le site public). Tu peux lui ajouter des options ensuite.
      </p>
    </div>
  );
}

function MachineCard({ machine }: { machine: MachineRow }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [sale, setSale] = useState(machine.sale_price ?? "");
  const [cost, setCost] = useState(machine.cost_price ?? "");
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function savePricing(nextSale: string, nextCost: string) {
    startTransition(async () => {
      await updateMachinePricing(machine.id, {
        sale_price: nextSale === "" ? null : Number(nextSale),
        cost_price: nextCost === "" ? null : Number(nextCost),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
      router.refresh();
    });
  }

  const baseMargin =
    sale !== "" && cost !== "" ? Number(sale) - Number(cost) : null;
  const opts = machine.options || [];

  return (
    <div className="rounded-lg border border-gray-200">
      {/* En-tête machine */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
        <button onClick={() => setExpanded((v) => !v)}
          className="text-gray-400 hover:text-gray-700 text-xs w-4" title="Options">
          {expanded ? "▼" : "▶"}
        </button>
        <div className="flex-1 min-w-[160px]">
          <span className="font-medium text-sm">{machine.name}</span>
          {machine.published === false && (
            <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-400 border border-gray-200 rounded px-1 py-0.5">
              interne
            </span>
          )}
          <div className="text-xs text-gray-400">{machine.category || "—"}</div>
        </div>

        <label className="text-xs text-gray-500">
          PV{" "}
          <input className={inp} type="number" min="0" step="100" value={sale} placeholder="—"
            onChange={(e) => setSale(e.target.value)}
            onBlur={() => savePricing(sale, cost)} />
        </label>
        <label className="text-xs text-gray-500">
          Coût{" "}
          <input className={inp} type="number" min="0" step="100" value={cost} placeholder="—"
            onChange={(e) => setCost(e.target.value)}
            onBlur={() => savePricing(sale, cost)} />
        </label>
        <div className="text-sm w-28 text-right">
          {baseMargin != null ? (
            <span className={baseMargin >= 0 ? "text-green-700" : "text-red-600"}>
              {eur.format(baseMargin)}
            </span>
          ) : (
            <span className="text-gray-300">—</span>
          )}
          <div className="text-[10px] text-gray-400">marge brute</div>
        </div>
        <div className="w-4 text-green-600 text-xs">{saved ? "✓" : ""}</div>
      </div>

      {/* Options (sous-section) */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3">
          <OptionsSection machineId={machine.id} options={opts} />
        </div>
      )}
      {!expanded && opts.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-1.5 text-xs text-gray-400">
          {opts.length} option{opts.length > 1 ? "s" : ""} — cliquer pour déplier
        </div>
      )}
    </div>
  );
}

function OptionsSection({
  machineId, options,
}: { machineId: number; options: MachineOptionRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [sale, setSale] = useState("");
  const [cost, setCost] = useState("");

  const optInp = "w-24 rounded border border-gray-300 px-1.5 py-1 text-sm text-right focus:border-blue-500 focus:outline-none";

  function add() {
    if (!name.trim()) return;
    startTransition(async () => {
      await addMachineOption(machineId, {
        name,
        sale_price: sale === "" ? 0 : Number(sale),
        cost_price: cost === "" ? 0 : Number(cost),
      });
      setName(""); setSale(""); setCost("");
      router.refresh();
    });
  }

  function patch(id: number, field: "sale_price" | "cost_price", value: number) {
    startTransition(async () => {
      await updateMachineOption(id, { [field]: value });
      router.refresh();
    });
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 mb-2">Options</h4>
      <div className="space-y-1.5">
        {options.length === 0 && (
          <p className="text-xs text-gray-400">Aucune option pour cette machine.</p>
        )}
        {options.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="flex-1 min-w-[140px]">{o.name}</span>
            <label className="text-xs text-gray-400">
              +PV{" "}
              <input className={optInp} type="number" min="0" step="50" defaultValue={Number(o.sale_price)}
                onBlur={(e) => patch(o.id, "sale_price", Number(e.target.value))} />
            </label>
            <label className="text-xs text-gray-400">
              +Coût{" "}
              <input className={optInp} type="number" min="0" step="50" defaultValue={Number(o.cost_price)}
                onBlur={(e) => patch(o.id, "cost_price", Number(e.target.value))} />
            </label>
            <button
              onClick={() => startTransition(async () => { await deleteMachineOption(o.id); router.refresh(); })}
              className="text-gray-300 hover:text-red-500" title="Supprimer">✕</button>
          </div>
        ))}
      </div>

      {/* Ajout d'une option */}
      <div className="flex flex-wrap items-end gap-2 mt-3 pt-3 border-t border-gray-200">
        <div>
          <label className="block text-[11px] text-gray-400 mb-0.5">Nom de l&apos;option</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ex. 3e axe rotatif"
            className="text-sm rounded border border-gray-300 px-2 py-1 w-44" />
        </div>
        <div>
          <label className="block text-[11px] text-gray-400 mb-0.5">+ Prix de vente</label>
          <input value={sale} onChange={(e) => setSale(e.target.value)} type="number" min="0" step="50"
            placeholder="0" className={optInp} />
        </div>
        <div>
          <label className="block text-[11px] text-gray-400 mb-0.5">+ Coût</label>
          <input value={cost} onChange={(e) => setCost(e.target.value)} type="number" min="0" step="50"
            placeholder="0" className={optInp} />
        </div>
        <button onClick={add}
          className="text-sm bg-gray-800 text-white rounded px-3 py-1.5 hover:bg-gray-700">
          + Option
        </button>
      </div>
    </div>
  );
}
