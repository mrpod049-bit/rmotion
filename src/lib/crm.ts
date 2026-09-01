// Couche d'accès aux données du CRM (lecture). Les écritures passent par
// les server actions dans src/app/admin/crm/actions.ts.
import pool from "@/lib/db";

export type Stage = {
  id: number;
  name: string;
  sequence: number;
  is_won: boolean;
};

export type Lead = {
  id: number;
  name: string;
  type: "lead" | "opportunity";
  stage_id: number | null;
  partner_id: number | null;
  contact_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  expected_revenue: string; // NUMERIC revient en string via pg
  probability: number;
  source: string | null;
  assigned_to: string | null;
  active: boolean;
  won: boolean;
  lost_reason: string | null;
  created_at: Date;
  closed_at: Date | null;
  // Champs d'import (prospects scrapés) :
  sector: string | null;
  city: string | null;
  department: string | null;
  activity: string | null;
  website: string | null;
  score: number | null;
  contacted: boolean;
  contacted_at: Date | null;
  // Champs calculés depuis les lignes de chiffrage (crm_lead_lines) :
  revenue: string; // CA = Σ qté×prix (ou expected_revenue si aucune ligne)
  margin: string; // Marge = Σ qté×(prix − coût − acheminement) ; 0 si aucune ligne
  line_count: number; // nombre de lignes machines
};

// Sous-requête d'agrégation des lignes (options incluses), réutilisée pour
// lister/afficher les leads. revenue retombe sur expected_revenue si aucune ligne.
// Les options d'une ligne s'ajoutent au prix/coût unitaire, comptées par unité.
const LEAD_SELECT = `
  SELECT l.*,
    COALESCE(agg.revenue, l.expected_revenue) AS revenue,
    COALESCE(agg.margin, 0)                    AS margin,
    COALESCE(agg.line_count, 0)::int           AS line_count
  FROM crm_leads l
  LEFT JOIN (
    SELECT ll.lead_id,
      SUM(ll.quantity * (ll.unit_price + o.opt_sale))                                          AS revenue,
      SUM(ll.quantity * (ll.unit_price + o.opt_sale - ll.unit_cost - o.opt_cost - ll.delivery_cost)) AS margin,
      COUNT(*)                                                                                  AS line_count
    FROM crm_lead_lines ll
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(sale_price), 0) AS opt_sale,
             COALESCE(SUM(cost_price), 0) AS opt_cost
      FROM crm_lead_line_options WHERE line_id = ll.id
    ) o ON true
    GROUP BY ll.lead_id
  ) agg ON agg.lead_id = l.id
`;

export async function getStages(): Promise<Stage[]> {
  const { rows } = await pool.query(
    `SELECT id, name, sequence, is_won FROM crm_stages ORDER BY sequence, id`
  );
  return rows;
}

// Opportunités actives (le pipeline). type='opportunity' uniquement : les
// leads bruts scrapés (type='lead') vivent dans l'inbox, pas dans le kanban.
export async function getActiveLeads(): Promise<Lead[]> {
  const { rows } = await pool.query(
    `${LEAD_SELECT} WHERE l.active = true AND l.type = 'opportunity'
     ORDER BY l.created_at DESC`
  );
  return rows;
}

// Indicateurs du pipeline : CA et marge, bruts et pondérés par la probabilité.
export type PipelineStats = {
  count: number;
  revenue: number; // CA prévisionnel total
  revenueWeighted: number; // CA pondéré par la probabilité
  margin: number; // marge nette prévisionnelle totale
  marginWeighted: number; // marge pondérée par la probabilité
};

export type LeadLineOption = {
  id: number;
  machine_option_id: number | null;
  name: string;
  sale_price: string;
  cost_price: string;
};

export type LeadLine = {
  id: number;
  lead_id: number;
  machine_id: number | null;
  label: string;
  quantity: number;
  unit_price: string;
  unit_cost: string;
  delivery_cost: string;
  created_at: Date;
  options: LeadLineOption[]; // options retenues sur cette ligne
};

// Une option du catalogue, telle qu'attachée à une machine dans le sélecteur.
export type CatalogOption = {
  id: number;
  name: string;
  sale_price: string;
  cost_price: string;
};

// Machine proposée dans le sélecteur de lignes, avec ses options catalogue.
export type MachineOption = {
  id: number;
  name: string;
  sale_price: string | null;
  cost_price: string | null;
  options: CatalogOption[];
};

export type Activity = {
  id: number;
  lead_id: number;
  type: "call" | "email" | "meeting" | "todo";
  summary: string;
  due_date: string | null;
  done: boolean;
  done_at: Date | null;
  created_at: Date;
};

export type Note = {
  id: number;
  lead_id: number;
  body: string;
  created_at: Date;
};

export async function getLead(id: number): Promise<Lead | null> {
  const { rows } = await pool.query(`${LEAD_SELECT} WHERE l.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getLeadLines(leadId: number): Promise<LeadLine[]> {
  const { rows } = await pool.query(
    `SELECT ll.*,
       COALESCE(
         (SELECT json_agg(json_build_object(
             'id', o.id, 'machine_option_id', o.machine_option_id,
             'name', o.name, 'sale_price', o.sale_price, 'cost_price', o.cost_price
           ) ORDER BY o.id)
          FROM crm_lead_line_options o WHERE o.line_id = ll.id),
         '[]'::json
       ) AS options
     FROM crm_lead_lines ll WHERE ll.lead_id = $1 ORDER BY ll.id`,
    [leadId]
  );
  return rows;
}

// Machines proposées dans le sélecteur de lignes d'un lead, avec leurs options.
// Le CRM voit TOUT le catalogue, y compris les machines internes non publiées.
export async function getMachineOptions(): Promise<MachineOption[]> {
  const { rows } = await pool.query(
    `SELECT m.id, m.name, m.sale_price, m.cost_price,
       COALESCE(
         (SELECT json_agg(json_build_object(
             'id', o.id, 'name', o.name,
             'sale_price', o.sale_price, 'cost_price', o.cost_price
           ) ORDER BY o.id)
          FROM machine_options o WHERE o.machine_id = m.id),
         '[]'::json
       ) AS options
     FROM machines m ORDER BY m.name`
  );
  return rows;
}

export async function getActivities(leadId: number): Promise<Activity[]> {
  const { rows } = await pool.query(
    `SELECT * FROM crm_activities WHERE lead_id = $1
     ORDER BY done ASC, due_date ASC NULLS LAST, created_at DESC`,
    [leadId]
  );
  return rows;
}

export async function getNotes(leadId: number): Promise<Note[]> {
  const { rows } = await pool.query(
    `SELECT * FROM crm_notes WHERE lead_id = $1 ORDER BY created_at DESC`,
    [leadId]
  );
  return rows;
}

// ---------------------------------------------------------------------
// Inbox des leads bruts (prospects scrapés, type='lead')
// ---------------------------------------------------------------------

export type InboxLead = {
  id: number;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  department: string | null;
  sector: string | null;
  activity: string | null;
  website: string | null;
  score: number | null;
  contacted_email: boolean;
  contacted_email_at: Date | null;
  contacted_phone: boolean;
  contacted_phone_at: Date | null;
  not_interested: boolean;
  not_interested_at: Date | null;
  created_at: Date;
};

// Filtre par canal de contact : jamais / email / téléphone / les deux.
export type ContactChannel = "all" | "none" | "email" | "phone" | "both";

export type InboxFilters = {
  sector?: string;
  channel?: ContactChannel;
  q?: string;
  notInterested?: boolean; // false = à qualifier (défaut), true = liste des non intéressés
  limit?: number;
  offset?: number;
};

export async function getSectors(): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT DISTINCT sector FROM crm_leads
     WHERE type = 'lead' AND active = true AND sector IS NOT NULL
     ORDER BY sector`
  );
  return rows.map((r) => r.sector);
}

export async function getInboxLeads(
  f: InboxFilters
): Promise<{ rows: InboxLead[]; total: number }> {
  const where: string[] = ["type = 'lead'", "active = true"];
  const params: unknown[] = [];
  where.push(f.notInterested ? "not_interested = true" : "not_interested = false");
  if (f.sector) { params.push(f.sector); where.push(`sector = $${params.length}`); }
  switch (f.channel) {
    case "none": where.push("NOT contacted_email AND NOT contacted_phone"); break;
    case "email": where.push("contacted_email = true"); break;
    case "phone": where.push("contacted_phone = true"); break;
    case "both": where.push("contacted_email AND contacted_phone"); break;
    default: break; // "all"
  }
  if (f.q) {
    params.push(`%${f.q}%`);
    where.push(`(name ILIKE $${params.length} OR city ILIKE $${params.length} OR activity ILIKE $${params.length})`);
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;

  const totalRes = await pool.query(
    `SELECT COUNT(*)::int AS n FROM crm_leads ${whereSql}`,
    params
  );

  const limit = Math.min(f.limit ?? 50, 200);
  const offset = f.offset ?? 0;
  params.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT id, name, company_name, email, phone, city, department, sector,
            activity, website, score,
            contacted_email, contacted_email_at, contacted_phone, contacted_phone_at,
            not_interested, not_interested_at, created_at
     FROM crm_leads ${whereSql}
     ORDER BY (contacted_email OR contacted_phone) ASC, score DESC NULLS LAST, name ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total: totalRes.rows[0].n };
}

// Compteurs pour l'inbox et le lien depuis le pipeline.
export async function getInboxCounts(): Promise<{
  toQualify: number;
  toContact: number;
  notInterested: number;
}> {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE NOT not_interested)::int AS to_qualify,
       COUNT(*) FILTER (WHERE NOT not_interested AND NOT contacted_email AND NOT contacted_phone)::int AS to_contact,
       COUNT(*) FILTER (WHERE not_interested)::int AS not_interested
     FROM crm_leads WHERE type = 'lead' AND active = true`
  );
  return {
    toQualify: rows[0].to_qualify,
    toContact: rows[0].to_contact,
    notInterested: rows[0].not_interested,
  };
}

// ---------------------------------------------------------------------
// Journal d'audit (crm_activity_log)
// ---------------------------------------------------------------------

export type LogEntry = {
  id: number;
  entity_type: string;
  entity_id: number | null;
  entity_label: string | null;
  action: string;
  detail: string | null;
  actor: string | null;
  created_at: Date;
};

export async function getActivityLog(f: {
  action?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: LogEntry[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.action) { params.push(f.action); where.push(`action = $${params.length}`); }
  if (f.q) { params.push(`%${f.q}%`); where.push(`(entity_label ILIKE $${params.length} OR detail ILIKE $${params.length})`); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalRes = await pool.query(
    `SELECT COUNT(*)::int AS n FROM crm_activity_log ${whereSql}`,
    params
  );

  const limit = Math.min(f.limit ?? 100, 300);
  const offset = f.offset ?? 0;
  params.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT * FROM crm_activity_log ${whereSql}
     ORDER BY created_at DESC, id DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total: totalRes.rows[0].n };
}

// Liste des types d'actions présents (pour le filtre).
export async function getLogActionTypes(): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT DISTINCT action FROM crm_activity_log ORDER BY action`
  );
  return rows.map((r) => r.action);
}

export function computeStats(leads: Lead[]): PipelineStats {
  let revenue = 0;
  let revenueWeighted = 0;
  let margin = 0;
  let marginWeighted = 0;
  for (const l of leads) {
    const rev = Number(l.revenue) || 0;
    const mar = Number(l.margin) || 0;
    const p = (l.probability || 0) / 100;
    revenue += rev;
    revenueWeighted += rev * p;
    margin += mar;
    marginWeighted += mar * p;
  }
  return { count: leads.length, revenue, revenueWeighted, margin, marginWeighted };
}
