"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Stage, Lead, Activity, Note, LeadLine, MachineOption } from "@/lib/crm";
import {
  updateLead,
  moveLead,
  markLost,
  reopenLead,
  addNote,
  addActivity,
  toggleActivity,
  addLeadLine,
  updateLeadLine,
  deleteLeadLine,
  addLineOption,
  removeLineOption,
  deleteLead,
} from "../actions";

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function fmt(d: Date | string) {
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

const ACT_LABELS: Record<Activity["type"], string> = {
  call: "📞 Appel",
  email: "✉️ Email",
  meeting: "🤝 RDV",
  todo: "✔️ Tâche",
};

const input =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

export default function LeadDetail({
  lead,
  stages,
  activities,
  notes,
  lines,
  machines,
}: {
  lead: Lead;
  stages: Stage[];
  activities: Activity[];
  notes: Note[];
  lines: LeadLine[];
  machines: MachineOption[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function refresh() {
    startTransition(() => router.refresh());
  }

  // --- Édition des champs principaux ---
  const [form, setForm] = useState({
    name: lead.name,
    company_name: lead.company_name ?? "",
    contact_name: lead.contact_name ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    expected_revenue: Number(lead.expected_revenue) || 0,
    probability: lead.probability,
    assigned_to: lead.assigned_to ?? "",
  });

  function saveFields() {
    startTransition(async () => {
      await updateLead(lead.id, {
        ...form,
        expected_revenue: Number(form.expected_revenue) || 0,
        probability: Number(form.probability) || 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    });
  }

  function onStageChange(stageId: number) {
    startTransition(async () => {
      await moveLead(lead.id, stageId);
      router.refresh();
    });
  }

  // Chiffrage : calculé depuis les lignes machines (repli sur le champ manuel).
  const hasLines = lead.line_count > 0;
  const revenue = Number(lead.revenue) || 0;
  const margin = Number(lead.margin) || 0;
  const prob = Number(form.probability) || 0;

  return (
    <div className="mt-4">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onBlur={saveFields}
            className="text-2xl font-semibold w-full bg-transparent focus:outline-none focus:bg-gray-50 rounded px-1 -mx-1"
          />
          <div className="text-sm text-gray-400 mt-1">
            Créée le {fmt(lead.created_at)} · source&nbsp;: {lead.source || "—"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {lead.active ? (
            !lead.won && <LostButton leadId={lead.id} onDone={refresh} />
          ) : (
            <span className="text-xs rounded-full bg-red-50 text-red-600 px-3 py-1">
              Perdue — {lead.lost_reason}
            </span>
          )}
          {lead.won && (
            <span className="text-xs rounded-full bg-green-50 text-green-700 px-3 py-1">
              ★ Gagnée
            </span>
          )}
          {!lead.active && (
            <button
              onClick={() => startTransition(async () => { await reopenLead(lead.id); router.refresh(); })}
              className="text-xs text-blue-600 hover:underline"
            >
              Rouvrir l&apos;opportunité
            </button>
          )}
        </div>
      </div>

      {/* Étape */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {stages.map((s) => (
          <button
            key={s.id}
            onClick={() => onStageChange(s.id)}
            disabled={!lead.active}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 ${
              lead.stage_id === s.id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {s.is_won ? "★ " : ""}{s.name}
          </button>
        ))}
      </div>

      {/* Lignes machines (chiffrage détaillé) */}
      <div className="mb-6">
        <LinesPanel leadId={lead.id} lines={lines} machines={machines} onChange={refresh} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Colonne gauche : coordonnées + montant */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-500">Coordonnées</h3>
            <Field label="Société">
              <input className={input} value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                onBlur={saveFields} />
            </Field>
            <Field label="Contact">
              <input className={input} value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                onBlur={saveFields} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <input className={input} type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onBlur={saveFields} />
              </Field>
              <Field label="Téléphone">
                <input className={input} value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  onBlur={saveFields} />
              </Field>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-500">Chiffrage prévisionnel</h3>

            {hasLines ? (
              <div className="grid grid-cols-2 gap-3">
                <Stat label="CA prévisionnel" value={eur.format(revenue)} />
                <Stat
                  label="Marge nette"
                  value={eur.format(margin)}
                  hint={revenue > 0 ? `${Math.round((margin / revenue) * 100)}%` : undefined}
                  positive={margin >= 0}
                />
                <Stat label="CA pondéré" value={eur.format((revenue * prob) / 100)} muted />
                <Stat label="Marge pondérée" value={eur.format((margin * prob) / 100)} muted />
              </div>
            ) : (
              <Field label="CA estimé (€) — sans détail machines">
                <input className={input} type="number" min="0" step="100"
                  value={form.expected_revenue}
                  onChange={(e) => setForm({ ...form, expected_revenue: Number(e.target.value) })}
                  onBlur={saveFields} />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Field label="Probabilité (%)">
                <input className={input} type="number" min="0" max="100" step="5"
                  value={form.probability}
                  onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                  onBlur={saveFields} />
              </Field>
              <Field label="Commercial assigné">
                <input className={input} value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  onBlur={saveFields} placeholder="ex. antoine@rmotion.fr" />
              </Field>
            </div>
            {hasLines && (
              <p className="text-xs text-gray-400">
                CA et marge calculés depuis les machines ci-dessous.
              </p>
            )}
            {saved && <p className="text-xs text-green-600">Enregistré ✓</p>}
          </div>
        </div>

        {/* Colonne droite : activités + notes */}
        <div className="space-y-4">
          <ActivitiesPanel leadId={lead.id} activities={activities} onChange={refresh} />
          <NotesPanel leadId={lead.id} notes={notes} onChange={refresh} />
        </div>
      </div>

      {/* Zone de suppression définitive */}
      <DeleteZone leadId={lead.id} hasLines={hasLines} />
    </div>
  );
}

function DeleteZone({ leadId, hasLines }: { leadId: number; hasLines: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-10 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
      <p className="text-xs text-gray-400">
        Supprimer efface définitivement cette opportunité{hasLines ? ", ses machines," : ","} ses
        notes et ses activités. Irréversible — pour la sortir du pipeline sans effacer, utilise
        plutôt « Marquer perdue ».
      </p>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="text-xs text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50 whitespace-nowrap"
        >
          Supprimer définitivement
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Confirmer&nbsp;?</span>
          <button
            disabled={pending}
            onClick={() => startTransition(() => deleteLead(leadId))}
            className="text-xs bg-red-600 text-white rounded-md px-3 py-1.5 hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? "Suppression…" : "Oui, supprimer"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="text-xs text-gray-500 px-2 py-1.5 hover:underline"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Stat({
  label, value, hint, muted, positive,
}: {
  label: string; value: string; hint?: string; muted?: boolean; positive?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div
        className={`text-lg font-semibold ${
          muted ? "text-gray-400" : positive === false ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
        {hint && <span className="text-xs font-normal text-gray-400 ml-1">({hint})</span>}
      </div>
    </div>
  );
}

function LostButton({ leadId, onDone }: { leadId: number; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [, startTransition] = useTransition();
  if (!open)
    return (
      <button onClick={() => setOpen(true)}
        className="text-xs text-red-600 border border-red-200 rounded-full px-3 py-1 hover:bg-red-50">
        Marquer perdue
      </button>
    );
  return (
    <div className="flex items-center gap-2">
      <input autoFocus value={reason} onChange={(e) => setReason(e.target.value)}
        placeholder="Motif (prix, délai…)"
        className="text-xs rounded border border-gray-300 px-2 py-1" />
      <button
        onClick={() => startTransition(async () => { await markLost(leadId, reason); onDone(); })}
        className="text-xs bg-red-600 text-white rounded px-2 py-1">
        OK
      </button>
      <button onClick={() => setOpen(false)} className="text-xs text-gray-400">✕</button>
    </div>
  );
}

function ActivitiesPanel({
  leadId, activities, onChange,
}: { leadId: number; activities: Activity[]; onChange: () => void }) {
  const [type, setType] = useState("call");
  const [summary, setSummary] = useState("");
  const [due, setDue] = useState("");
  const [, startTransition] = useTransition();

  function add() {
    if (!summary.trim()) return;
    startTransition(async () => {
      await addActivity(leadId, { type, summary, due_date: due || undefined });
      setSummary(""); setDue("");
      onChange();
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Prochaines actions</h3>
      <div className="flex flex-col gap-2 mb-4">
        {activities.length === 0 && (
          <p className="text-xs text-gray-400">Aucune activité planifiée.</p>
        )}
        {activities.map((a) => {
          const overdue = !a.done && a.due_date && new Date(a.due_date) < new Date(new Date().toDateString());
          return (
            <div key={a.id} className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={a.done} className="mt-1"
                onChange={() => startTransition(async () => { await toggleActivity(a.id, leadId); onChange(); })} />
              <div className={a.done ? "line-through text-gray-400" : ""}>
                <span className="text-gray-500 text-xs mr-1">{ACT_LABELS[a.type]}</span>
                {a.summary}
                {a.due_date && (
                  <span className={`ml-2 text-xs ${overdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {fmtDate(a.due_date)}{overdue ? " ⚠" : ""}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="text-xs rounded border border-gray-300 px-2 py-1">
          <option value="call">📞 Appel</option>
          <option value="email">✉️ Email</option>
          <option value="meeting">🤝 RDV</option>
          <option value="todo">✔️ Tâche</option>
        </select>
        <input value={summary} onChange={(e) => setSummary(e.target.value)}
          placeholder="Relancer par téléphone…"
          className="flex-1 min-w-[120px] text-xs rounded border border-gray-300 px-2 py-1" />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
          className="text-xs rounded border border-gray-300 px-2 py-1" />
        <button onClick={add}
          className="text-xs bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700">
          Ajouter
        </button>
      </div>
    </div>
  );
}

function NotesPanel({
  leadId, notes, onChange,
}: { leadId: number; notes: Note[]; onChange: () => void }) {
  const [body, setBody] = useState("");
  const [, startTransition] = useTransition();

  function add() {
    if (!body.trim()) return;
    startTransition(async () => {
      await addNote(leadId, body);
      setBody("");
      onChange();
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Historique / notes</h3>
      <div className="flex gap-2 mb-4">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2}
          placeholder="Ajouter une note…"
          className="flex-1 text-sm rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none" />
        <button onClick={add}
          className="text-xs bg-blue-600 text-white rounded px-3 self-stretch hover:bg-blue-700">
          Noter
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {notes.length === 0 && <p className="text-xs text-gray-400">Aucune note.</p>}
        {notes.map((n) => (
          <div key={n.id} className="text-sm border-l-2 border-gray-200 pl-3">
            <div className="text-xs text-gray-400 mb-0.5">{fmt(n.created_at)}</div>
            <div className="whitespace-pre-line">{n.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Somme des options d'une ligne (montants ajoutés au PV / au coût).
function optSums(l: LeadLine) {
  return l.options.reduce(
    (a, o) => ({ sale: a.sale + Number(o.sale_price), cost: a.cost + Number(o.cost_price) }),
    { sale: 0, cost: 0 }
  );
}
function lineCA(l: LeadLine) {
  return l.quantity * (Number(l.unit_price) + optSums(l).sale);
}
function lineMargin(l: LeadLine) {
  const o = optSums(l);
  return l.quantity * (Number(l.unit_price) + o.sale - Number(l.unit_cost) - o.cost - Number(l.delivery_cost));
}

function LinesPanel({
  leadId, lines, machines, onChange,
}: {
  leadId: number;
  lines: LeadLine[];
  machines: MachineOption[];
  onChange: () => void;
}) {
  const [, startTransition] = useTransition();

  // Formulaire d'ajout d'une ligne (options cochées incluses).
  const emptyDraft = {
    machine_id: "",
    label: "",
    quantity: 1,
    unit_price: 0,
    unit_cost: 0,
    delivery_cost: 0,
    optionIds: [] as number[],
  };
  const [draft, setDraft] = useState(emptyDraft);

  const pickedMachine = machines.find((m) => String(m.id) === draft.machine_id);
  const pickedOptions = pickedMachine?.options ?? [];

  function onPickMachine(id: string) {
    const m = machines.find((x) => String(x.id) === id);
    if (m) {
      setDraft({
        ...draft,
        machine_id: id,
        label: m.name,
        unit_price: Number(m.sale_price) || 0,
        unit_cost: Number(m.cost_price) || 0,
        optionIds: [],
      });
    } else {
      setDraft({ ...draft, machine_id: id, optionIds: [] });
    }
  }

  function toggleOption(id: number) {
    setDraft((d) => ({
      ...d,
      optionIds: d.optionIds.includes(id)
        ? d.optionIds.filter((x) => x !== id)
        : [...d.optionIds, id],
    }));
  }

  function add() {
    if (!draft.label.trim()) return;
    const options = pickedOptions
      .filter((o) => draft.optionIds.includes(o.id))
      .map((o) => ({
        machine_option_id: o.id,
        name: o.name,
        sale_price: Number(o.sale_price),
        cost_price: Number(o.cost_price),
      }));
    startTransition(async () => {
      await addLeadLine(leadId, {
        machine_id: draft.machine_id ? Number(draft.machine_id) : null,
        label: draft.label,
        quantity: draft.quantity,
        unit_price: draft.unit_price,
        unit_cost: draft.unit_cost,
        delivery_cost: draft.delivery_cost,
        options,
      });
      setDraft(emptyDraft);
      onChange();
    });
  }

  function patch(lineId: number, field: string, value: number) {
    startTransition(async () => {
      await updateLeadLine(lineId, leadId, { [field]: value });
      onChange();
    });
  }

  const totalRevenue = lines.reduce((s, l) => s + lineCA(l), 0);
  const totalMargin = lines.reduce((s, l) => s + lineMargin(l), 0);

  const cell = "px-2 py-1.5";
  const numInp =
    "w-20 rounded border border-gray-200 px-1.5 py-1 text-sm text-right focus:border-blue-500 focus:outline-none";

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Machines &amp; quantités</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-400 text-left text-xs">
            <tr>
              <th className={cell}>Machine</th>
              <th className={`${cell} text-right`}>Qté</th>
              <th className={`${cell} text-right`}>PV unit.</th>
              <th className={`${cell} text-right`}>Coût import</th>
              <th className={`${cell} text-right`}>Achem.+dispo</th>
              <th className={`${cell} text-right`}>CA</th>
              <th className={`${cell} text-right`}>Marge</th>
              <th className={cell}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((l) => (
              <tr key={l.id}>
                <td className={`${cell} align-top`}>
                  <div className="font-medium">{l.label}</div>
                  <LineOptions line={l} leadId={leadId} machines={machines} onChange={onChange} />
                </td>
                <td className={`${cell} text-right align-top`}>
                  <input className={numInp + " w-14"} type="number" min="1" step="1"
                    defaultValue={l.quantity}
                    onBlur={(e) => patch(l.id, "quantity", Number(e.target.value))} />
                </td>
                <td className={`${cell} text-right align-top`}>
                  <input className={numInp} type="number" min="0" step="100"
                    defaultValue={Number(l.unit_price)}
                    onBlur={(e) => patch(l.id, "unit_price", Number(e.target.value))} />
                </td>
                <td className={`${cell} text-right align-top`}>
                  <input className={numInp} type="number" min="0" step="100"
                    defaultValue={Number(l.unit_cost)}
                    onBlur={(e) => patch(l.id, "unit_cost", Number(e.target.value))} />
                </td>
                <td className={`${cell} text-right align-top`}>
                  <input className={numInp} type="number" min="0" step="50"
                    defaultValue={Number(l.delivery_cost)}
                    onBlur={(e) => patch(l.id, "delivery_cost", Number(e.target.value))} />
                </td>
                <td className={`${cell} text-right whitespace-nowrap align-top`}>{eur.format(lineCA(l))}</td>
                <td className={`${cell} text-right whitespace-nowrap align-top ${lineMargin(l) >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {eur.format(lineMargin(l))}
                </td>
                <td className={`${cell} text-right align-top`}>
                  <button
                    onClick={() => startTransition(async () => { await deleteLeadLine(l.id, leadId); onChange(); })}
                    className="text-gray-300 hover:text-red-500" title="Supprimer la ligne">✕</button>
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-3 text-xs text-gray-400 text-center">
                  Aucune machine. Ajoute-en une ci-dessous.
                </td>
              </tr>
            )}
          </tbody>
          {lines.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 font-semibold">
                <td className={cell} colSpan={5}>Total</td>
                <td className={`${cell} text-right whitespace-nowrap`}>{eur.format(totalRevenue)}</td>
                <td className={`${cell} text-right whitespace-nowrap ${totalMargin >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {eur.format(totalMargin)}
                </td>
                <td className={cell}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Ajout d'une ligne */}
      <div className="border-t border-gray-100 mt-3 pt-3">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Machine</label>
            <select value={draft.machine_id} onChange={(e) => onPickMachine(e.target.value)}
              className="text-sm rounded border border-gray-300 px-2 py-1 max-w-[180px]">
              <option value="">— hors catalogue —</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Libellé</label>
            <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="Nom machine" className="text-sm rounded border border-gray-300 px-2 py-1 w-40" />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Qté</label>
            <input type="number" min="1" step="1" value={draft.quantity}
              onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })}
              className={numInp + " w-14"} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">PV unit.</label>
            <input type="number" min="0" step="100" value={draft.unit_price}
              onChange={(e) => setDraft({ ...draft, unit_price: Number(e.target.value) })} className={numInp} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Coût import</label>
            <input type="number" min="0" step="100" value={draft.unit_cost}
              onChange={(e) => setDraft({ ...draft, unit_cost: Number(e.target.value) })} className={numInp} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Achem.+dispo</label>
            <input type="number" min="0" step="50" value={draft.delivery_cost}
              onChange={(e) => setDraft({ ...draft, delivery_cost: Number(e.target.value) })} className={numInp} />
          </div>
          <button onClick={add}
            className="text-sm bg-blue-600 text-white rounded px-3 py-1.5 hover:bg-blue-700">
            + Ajouter
          </button>
        </div>

        {/* Options de la machine choisie, à cocher */}
        {pickedOptions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-1">
            <span className="text-[11px] text-gray-400 w-full">Options :</span>
            {pickedOptions.map((o) => (
              <label key={o.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                <input type="checkbox" checked={draft.optionIds.includes(o.id)}
                  onChange={() => toggleOption(o.id)} />
                {o.name}
                <span className="text-gray-400">
                  (+{eur.format(Number(o.sale_price))})
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Options attachées à une ligne : liste modifiable + ajout depuis le catalogue.
function LineOptions({
  line, leadId, machines, onChange,
}: {
  line: LeadLine;
  leadId: number;
  machines: MachineOption[];
  onChange: () => void;
}) {
  const [, startTransition] = useTransition();
  const machine = machines.find((m) => m.id === line.machine_id);
  const used = new Set(line.options.map((o) => o.machine_option_id));
  const available = (machine?.options ?? []).filter((o) => !used.has(o.id));

  function addOpt(catalogId: string) {
    const o = machine?.options.find((x) => String(x.id) === catalogId);
    if (!o) return;
    startTransition(async () => {
      await addLineOption(line.id, leadId, {
        machine_option_id: o.id,
        name: o.name,
        sale_price: Number(o.sale_price),
        cost_price: Number(o.cost_price),
      });
      onChange();
    });
  }

  return (
    <div className="mt-1 space-y-0.5">
      {line.options.map((o) => (
        <div key={o.id} className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="text-gray-300">↳</span>
          {o.name}
          <span className="text-gray-400">(+{eur.format(Number(o.sale_price))})</span>
          <button
            onClick={() => startTransition(async () => { await removeLineOption(o.id, leadId); onChange(); })}
            className="text-gray-300 hover:text-red-500" title="Retirer l'option">✕</button>
        </div>
      ))}
      {available.length > 0 && (
        <select value="" onChange={(e) => addOpt(e.target.value)}
          className="text-[11px] text-gray-500 border border-gray-200 rounded px-1 py-0.5 mt-0.5">
          <option value="">+ option…</option>
          {available.map((o) => (
            <option key={o.id} value={o.id}>{o.name} (+{eur.format(Number(o.sale_price))})</option>
          ))}
        </select>
      )}
    </div>
  );
}
