"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Déplace une opportunité vers une autre étape (glisser-déposer du kanban).
// Si l'étape cible est « gagné », on cale la probabilité à 100 %.
export async function moveLead(leadId: number, stageId: number) {
  const { rows } = await pool.query(
    `SELECT is_won FROM crm_stages WHERE id = $1`,
    [stageId]
  );
  const isWon = rows[0]?.is_won === true;

  await pool.query(
    `UPDATE crm_leads
       SET stage_id = $1,
           won = $2,
           probability = CASE WHEN $2 THEN 100 ELSE probability END,
           closed_at = CASE WHEN $2 THEN NOW() ELSE NULL END
     WHERE id = $3`,
    [stageId, isWon, leadId]
  );

  revalidatePath("/admin/crm");
}

// Crée une nouvelle opportunité dans la première étape du pipeline.
export async function createLead(input: {
  name: string;
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  expected_revenue?: number;
}) {
  const name = input.name?.trim();
  if (!name) throw new Error("Le nom de l'opportunité est requis.");

  const { rows: stageRows } = await pool.query(
    `SELECT id FROM crm_stages ORDER BY sequence, id LIMIT 1`
  );
  const firstStageId = stageRows[0]?.id ?? null;

  await pool.query(
    `INSERT INTO crm_leads
       (name, type, stage_id, company_name, contact_name, email, phone,
        expected_revenue, source)
     VALUES ($1, 'opportunity', $2, $3, $4, $5, $6, $7, 'manuel')`,
    [
      name,
      firstStageId,
      input.company_name?.trim() || null,
      input.contact_name?.trim() || null,
      input.email?.trim() || null,
      input.phone?.trim() || null,
      input.expected_revenue ?? 0,
    ]
  );

  revalidatePath("/admin/crm");
}

// Met à jour les champs éditables d'une opportunité (fiche détail).
export async function updateLead(
  leadId: number,
  input: {
    name?: string;
    company_name?: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    expected_revenue?: number;
    probability?: number;
    assigned_to?: string;
  }
) {
  await pool.query(
    `UPDATE crm_leads SET
       name = COALESCE($2, name),
       company_name = $3, contact_name = $4, email = $5, phone = $6,
       expected_revenue = COALESCE($7, expected_revenue),
       probability = COALESCE($8, probability),
       assigned_to = $9
     WHERE id = $1`,
    [
      leadId,
      input.name?.trim() || null,
      input.company_name?.trim() || null,
      input.contact_name?.trim() || null,
      input.email?.trim() || null,
      input.phone?.trim() || null,
      input.expected_revenue ?? null,
      input.probability ?? null,
      input.assigned_to?.trim() || null,
    ]
  );
  revalidatePath(`/admin/crm/${leadId}`);
  revalidatePath("/admin/crm");
}

// Marque une opportunité comme perdue : archivée (active=false) avec un motif.
export async function markLost(leadId: number, reason: string) {
  await pool.query(
    `UPDATE crm_leads
       SET active = false, won = false, probability = 0,
           lost_reason = $2, closed_at = NOW()
     WHERE id = $1`,
    [leadId, reason?.trim() || "Non précisé"]
  );
  revalidatePath("/admin/crm");
}

// Supprime DÉFINITIVEMENT une opportunité et tout ce qui s'y rattache
// (lignes machines, activités, notes — via ON DELETE CASCADE). Irréversible.
// À ne pas confondre avec markLost, qui ne fait qu'archiver.
export async function deleteLead(leadId: number) {
  await pool.query(`DELETE FROM crm_leads WHERE id = $1`, [leadId]);
  revalidatePath("/admin/crm");
  redirect("/admin/crm");
}

// Convertit un lead brut (inbox) en opportunité : le fait entrer dans le
// pipeline (première étape) et ouvre sa fiche.
export async function convertLeadToOpportunity(leadId: number) {
  const { rows } = await pool.query(
    `SELECT id FROM crm_stages ORDER BY sequence, id LIMIT 1`
  );
  const firstStageId = rows[0]?.id ?? null;
  await pool.query(
    `UPDATE crm_leads
       SET type = 'opportunity', stage_id = COALESCE(stage_id, $2), active = true
     WHERE id = $1`,
    [leadId, firstStageId]
  );
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/leads");
  redirect(`/admin/crm/${leadId}`);
}

// Déclare (ou annule) un contact téléphonique sur un lead. Manuel : la synchro
// CSV n'y touche jamais.
export async function setPhoneContacted(leadId: number, value: boolean) {
  await pool.query(
    `UPDATE crm_leads
       SET contacted_phone = $2,
           contacted_phone_at = CASE WHEN $2 THEN COALESCE(contacted_phone_at, NOW()) ELSE NULL END
     WHERE id = $1`,
    [leadId, value]
  );
  revalidatePath("/admin/crm/leads");
  revalidatePath("/admin/crm");
}

// Met un lead de côté (archivé, sort de l'inbox) sans le supprimer.
export async function ignoreLead(leadId: number) {
  await pool.query(
    `UPDATE crm_leads SET active = false WHERE id = $1`,
    [leadId]
  );
  revalidatePath("/admin/crm/leads");
}

// Réactive une opportunité clôturée (perdue) et la remet dans le pipeline.
export async function reopenLead(leadId: number) {
  await pool.query(
    `UPDATE crm_leads
       SET active = true, won = false, lost_reason = NULL, closed_at = NULL
     WHERE id = $1`,
    [leadId]
  );
  revalidatePath(`/admin/crm/${leadId}`);
  revalidatePath("/admin/crm");
}

// --- Notes (chatter) ---
export async function addNote(leadId: number, body: string) {
  const text = body?.trim();
  if (!text) return;
  await pool.query(
    `INSERT INTO crm_notes (lead_id, body) VALUES ($1, $2)`,
    [leadId, text]
  );
  revalidatePath(`/admin/crm/${leadId}`);
}

// --- Activités (prochaines actions) ---
export async function addActivity(
  leadId: number,
  input: { type: string; summary: string; due_date?: string }
) {
  const summary = input.summary?.trim();
  if (!summary) return;
  const type = ["call", "email", "meeting", "todo"].includes(input.type)
    ? input.type
    : "todo";
  await pool.query(
    `INSERT INTO crm_activities (lead_id, type, summary, due_date)
     VALUES ($1, $2, $3, $4)`,
    [leadId, type, summary, input.due_date || null]
  );
  revalidatePath(`/admin/crm/${leadId}`);
}

export async function toggleActivity(activityId: number, leadId: number) {
  await pool.query(
    `UPDATE crm_activities
       SET done = NOT done,
           done_at = CASE WHEN NOT done THEN NOW() ELSE NULL END
     WHERE id = $1`,
    [activityId]
  );
  revalidatePath(`/admin/crm/${leadId}`);
}

// --- Lignes de chiffrage (machines × quantités) ---

// Recale expected_revenue du lead sur la somme de ses lignes, pour garder
// les vues qui lisent ce champ (kanban, stats) cohérentes avec le détail.
async function syncLeadRevenue(leadId: number) {
  // CA = Σ quantité × (prix unitaire + options de la ligne).
  await pool.query(
    `UPDATE crm_leads l
       SET expected_revenue = COALESCE(
         (SELECT SUM(ll.quantity * (ll.unit_price + COALESCE(o.opt_sale, 0)))
          FROM crm_lead_lines ll
          LEFT JOIN LATERAL (
            SELECT SUM(sale_price) AS opt_sale
            FROM crm_lead_line_options WHERE line_id = ll.id
          ) o ON true
          WHERE ll.lead_id = l.id),
         expected_revenue
       )
     WHERE l.id = $1`,
    [leadId]
  );
}

export async function addLeadLine(
  leadId: number,
  input: {
    machine_id?: number | null;
    label: string;
    quantity?: number;
    unit_price?: number;
    unit_cost?: number;
    delivery_cost?: number;
    options?: Array<{
      machine_option_id?: number | null;
      name: string;
      sale_price?: number;
      cost_price?: number;
    }>;
  }
) {
  const label = input.label?.trim();
  if (!label) throw new Error("Le libellé de la ligne est requis.");
  const { rows } = await pool.query(
    `INSERT INTO crm_lead_lines
       (lead_id, machine_id, label, quantity, unit_price, unit_cost, delivery_cost)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      leadId,
      input.machine_id ?? null,
      label,
      Math.max(1, Math.floor(input.quantity ?? 1)),
      input.unit_price ?? 0,
      input.unit_cost ?? 0,
      input.delivery_cost ?? 0,
    ]
  );
  const lineId = rows[0].id;

  // Options cochées : figées sur la ligne.
  for (const o of input.options ?? []) {
    if (!o.name?.trim()) continue;
    await pool.query(
      `INSERT INTO crm_lead_line_options (line_id, machine_option_id, name, sale_price, cost_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [lineId, o.machine_option_id ?? null, o.name.trim(), o.sale_price ?? 0, o.cost_price ?? 0]
    );
  }

  await syncLeadRevenue(leadId);
  revalidatePath(`/admin/crm/${leadId}`);
  revalidatePath("/admin/crm");
}

// Ajoute une option à une ligne existante (montants figés).
export async function addLineOption(
  lineId: number,
  leadId: number,
  option: {
    machine_option_id?: number | null;
    name: string;
    sale_price?: number;
    cost_price?: number;
  }
) {
  const name = option.name?.trim();
  if (!name) return;
  await pool.query(
    `INSERT INTO crm_lead_line_options (line_id, machine_option_id, name, sale_price, cost_price)
     VALUES ($1, $2, $3, $4, $5)`,
    [lineId, option.machine_option_id ?? null, name, option.sale_price ?? 0, option.cost_price ?? 0]
  );
  await syncLeadRevenue(leadId);
  revalidatePath(`/admin/crm/${leadId}`);
  revalidatePath("/admin/crm");
}

// Retire une option d'une ligne.
export async function removeLineOption(optionId: number, leadId: number) {
  await pool.query(`DELETE FROM crm_lead_line_options WHERE id = $1`, [optionId]);
  await syncLeadRevenue(leadId);
  revalidatePath(`/admin/crm/${leadId}`);
  revalidatePath("/admin/crm");
}

export async function updateLeadLine(
  lineId: number,
  leadId: number,
  input: {
    quantity?: number;
    unit_price?: number;
    unit_cost?: number;
    delivery_cost?: number;
  }
) {
  await pool.query(
    `UPDATE crm_lead_lines SET
       quantity = COALESCE($2, quantity),
       unit_price = COALESCE($3, unit_price),
       unit_cost = COALESCE($4, unit_cost),
       delivery_cost = COALESCE($5, delivery_cost)
     WHERE id = $1`,
    [
      lineId,
      input.quantity != null ? Math.max(1, Math.floor(input.quantity)) : null,
      input.unit_price ?? null,
      input.unit_cost ?? null,
      input.delivery_cost ?? null,
    ]
  );
  await syncLeadRevenue(leadId);
  revalidatePath(`/admin/crm/${leadId}`);
  revalidatePath("/admin/crm");
}

export async function deleteLeadLine(lineId: number, leadId: number) {
  await pool.query(`DELETE FROM crm_lead_lines WHERE id = $1`, [lineId]);
  await syncLeadRevenue(leadId);
  revalidatePath(`/admin/crm/${leadId}`);
  revalidatePath("/admin/crm");
}

// --- Prix / coûts du catalogue machines ---
export async function updateMachinePricing(
  machineId: number,
  input: { sale_price?: number | null; cost_price?: number | null }
) {
  await pool.query(
    `UPDATE machines SET sale_price = $2, cost_price = $3 WHERE id = $1`,
    [
      machineId,
      input.sale_price ?? null,
      input.cost_price ?? null,
    ]
  );
  revalidatePath("/admin/crm/machines");
}

// Transforme un nom en slug URL, en garantissant l'unicité dans machines.
async function uniqueSlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // enlève les accents
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180) || "machine";
  let slug = base;
  let n = 2;
  // Boucle tant que le slug est déjà pris.
  while (true) {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM machines WHERE slug = $1`,
      [slug]
    );
    if (!rowCount) return slug;
    slug = `${base}-${n++}`;
  }
}

// Crée une machine « interne CRM » (published=false : hors site public).
export async function createMachine(input: {
  name: string;
  sale_price?: number | null;
  cost_price?: number | null;
}) {
  const name = input.name?.trim();
  if (!name) throw new Error("Le nom de la machine est requis.");
  const slug = await uniqueSlug(name);
  await pool.query(
    `INSERT INTO machines (name, slug, sale_price, cost_price, published)
     VALUES ($1, $2, $3, $4, false)`,
    [name, slug, input.sale_price ?? null, input.cost_price ?? null]
  );
  revalidatePath("/admin/crm/machines");
}

// --- Options d'une machine ---
export async function addMachineOption(
  machineId: number,
  input: { name: string; sale_price?: number; cost_price?: number }
) {
  const name = input.name?.trim();
  if (!name) throw new Error("Le nom de l'option est requis.");
  await pool.query(
    `INSERT INTO machine_options (machine_id, name, sale_price, cost_price)
     VALUES ($1, $2, $3, $4)`,
    [machineId, name, input.sale_price ?? 0, input.cost_price ?? 0]
  );
  revalidatePath("/admin/crm/machines");
}

export async function updateMachineOption(
  optionId: number,
  input: { name?: string; sale_price?: number; cost_price?: number }
) {
  await pool.query(
    `UPDATE machine_options SET
       name = COALESCE($2, name),
       sale_price = COALESCE($3, sale_price),
       cost_price = COALESCE($4, cost_price)
     WHERE id = $1`,
    [optionId, input.name?.trim() || null, input.sale_price ?? null, input.cost_price ?? null]
  );
  revalidatePath("/admin/crm/machines");
}

export async function deleteMachineOption(optionId: number) {
  await pool.query(`DELETE FROM machine_options WHERE id = $1`, [optionId]);
  revalidatePath("/admin/crm/machines");
}
