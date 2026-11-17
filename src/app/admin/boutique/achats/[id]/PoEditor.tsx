"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePo } from "../actions";

type Line = { variant_id: number; supplier_ref: string; qty_ordered: number; unit_cost: number };
const inp = "w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none disabled:bg-gray-50";
const eur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

export default function PoEditor({ poId, editable, initial, variants }: {
  poId: number; editable: boolean;
  initial: { expected_at: string; notes: string; lines: Line[] };
  variants: { id: number; sku: string; label: string | null; product_name: string; cost_price: number | null }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const [expected, setExpected] = useState(initial.expected_at);
  const [notes, setNotes] = useState(initial.notes);
  const [lines, setLines] = useState<Line[]>(initial.lines);
  const [pick, setPick] = useState("");

  const total = lines.reduce((s, l) => s + l.qty_ordered * l.unit_cost, 0);
  const vById = new Map(variants.map((v) => [v.id, v]));
  const set = (i: number, patch: Partial<Line>) => setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const add = () => {
    const v = variants.find((x) => x.id === Number(pick));
    if (!v || lines.some((l) => l.variant_id === v.id)) return;
    setLines([...lines, { variant_id: v.id, supplier_ref: "", qty_ordered: 1, unit_cost: v.cost_price ?? 0 }]);
    setPick("");
  };

  const save = () => start(async () => {
    setMsg({});
    const r = await savePo(poId, { expected_at: expected || null, notes: notes || null, lines });
    if (r.ok) { setMsg({ ok: "Enregistré." }); router.refresh(); } else setMsg({ err: r.error });
  });

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div><label className="block text-xs text-gray-500 mb-1">Livraison attendue le</label><input type="date" className={inp} value={expected} onChange={(e) => setExpected(e.target.value)} /></div>
        <div className="md:col-span-2"><label className="block text-xs text-gray-500 mb-1">Notes (imprimées sur le BCF)</label><input className={inp} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </div>
      <table className="w-full text-sm">
        <thead className="text-gray-500 text-left"><tr><th className="py-1">Réf. Rmotion</th><th>Désignation</th><th>Réf. fournisseur</th><th>Qté</th><th>PU HT</th><th>Total</th><th /></tr></thead>
        <tbody>
          {lines.map((l, i) => {
            const v = vById.get(l.variant_id);
            return (
              <tr key={l.variant_id} className="border-t border-gray-100">
                <td className="py-1 pr-2 font-mono text-xs">{v?.sku}</td>
                <td className="pr-2">{v?.product_name} <span className="text-gray-400">{v?.label}</span></td>
                <td className="pr-2 w-36"><input className={inp} disabled={!editable} value={l.supplier_ref} onChange={(e) => set(i, { supplier_ref: e.target.value })} /></td>
                <td className="pr-2 w-24"><input className={inp} disabled={!editable} type="number" min="1" value={l.qty_ordered} onChange={(e) => set(i, { qty_ordered: Number(e.target.value) })} /></td>
                <td className="pr-2 w-28"><input className={inp} disabled={!editable} type="number" step="0.01" min="0" value={l.unit_cost} onChange={(e) => set(i, { unit_cost: Number(e.target.value) })} /></td>
                <td className="pr-2 whitespace-nowrap">{eur(l.qty_ordered * l.unit_cost)}</td>
                <td>{editable && <button type="button" className="text-red-600" onClick={() => setLines(lines.filter((_, j) => j !== i))}>✕</button>}</td>
              </tr>
            );
          })}
          {lines.length === 0 && <tr><td colSpan={7} className="py-3 text-gray-500">Aucune ligne.</td></tr>}
        </tbody>
      </table>
      <div className="mt-2 text-right text-sm font-medium">Total HT : {eur(total)}</div>
      {editable && (
        <div className="mt-3 flex flex-wrap gap-2">
          <select className={`${inp} max-w-md`} value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Ajouter une référence…</option>
            {variants.filter((v) => !lines.some((l) => l.variant_id === v.id)).map((v) => (
              <option key={v.id} value={v.id}>{v.sku} — {v.product_name} {v.label ?? ""}</option>
            ))}
          </select>
          <button type="button" onClick={add} className="rounded border border-gray-300 px-3 py-1 text-sm">+ Ajouter</button>
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="rounded bg-gray-900 px-4 py-1.5 text-sm text-white disabled:opacity-50">
          {pending ? "…" : editable ? "Enregistrer le bon" : "Enregistrer date / notes"}
        </button>
        {msg.ok && <span className="text-sm text-green-700">{msg.ok}</span>}
        {msg.err && <span className="text-sm text-red-700">{msg.err}</span>}
      </div>
    </div>
  );
}
