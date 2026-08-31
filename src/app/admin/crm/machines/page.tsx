import Link from "next/link";
import pool from "@/lib/db";
import MachinePricingTable from "./MachinePricingTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "CRM — Coûts machines", robots: { index: false, follow: false } };

export type MachineOptionRow = {
  id: number;
  name: string;
  sale_price: string;
  cost_price: string;
};

export type MachineRow = {
  id: number;
  name: string;
  category: string | null;
  published: boolean | null;
  sale_price: string | null;
  cost_price: string | null;
  options: MachineOptionRow[];
};

async function getMachines(): Promise<MachineRow[]> {
  const { rows } = await pool.query(
    `SELECT m.id, m.name, c.name AS category, m.published, m.sale_price, m.cost_price,
       COALESCE(
         (SELECT json_agg(json_build_object(
             'id', o.id, 'name', o.name,
             'sale_price', o.sale_price, 'cost_price', o.cost_price
           ) ORDER BY o.id)
          FROM machine_options o WHERE o.machine_id = m.id),
         '[]'::json
       ) AS options
     FROM machines m
     LEFT JOIN categories c ON c.id = m.category_id
     ORDER BY c.name NULLS LAST, m.name`
  );
  return rows;
}

export default async function MachinesPricingPage() {
  const machines = await getMachines();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link href="/admin/crm" className="text-sm text-gray-500 hover:underline">
        ← Retour au pipeline
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">Coûts & prix des machines</h1>
      <p className="text-sm text-gray-500 mb-6">
        Prix de vente conseillé et coût de revient d&apos;import France (unitaire, HT).
        L&apos;acheminement final et la mise à dispo se saisissent par ligne sur chaque opportunité.
      </p>
      <MachinePricingTable machines={machines} />
    </div>
  );
}
