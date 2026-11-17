"use server";
import { redirect } from "next/navigation";
import {
  cancelPurchaseOrder, createPurchaseOrder, markPurchaseOrderSent, receivePurchaseOrder, savePurchaseOrder, type PoLineInput,
} from "@/lib/shop/purchasing";
import { attempt, back, getActor, refreshStock, int } from "../_server";

export async function newPurchaseOrder(fd: FormData) {
  const supplierId = int(fd, "supplier_id");
  if (Number.isNaN(supplierId)) back("/admin/boutique/achats", { err: "Choisissez un fournisseur." });
  const id = await createPurchaseOrder(supplierId);
  redirect(`/admin/boutique/achats/${id}`);
}

export async function savePo(poId: number, data: { expected_at: string | null; notes: string | null; lines: PoLineInput[] }) {
  try {
    await savePurchaseOrder(poId, data);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function sendPo(fd: FormData) {
  const id = int(fd, "id");
  await attempt(`/admin/boutique/achats/${id}`, async () => {
    await markPurchaseOrderSent(id);
    return "Bon de commande marqué comme envoyé. Imprimez-le / enregistrez-le en PDF pour l'adresser au fournisseur.";
  });
}

export async function cancelPo(fd: FormData) {
  const id = int(fd, "id");
  await attempt(`/admin/boutique/achats/${id}`, async () => {
    await cancelPurchaseOrder(id);
    return "Bon de commande annulé.";
  });
}

export async function receivePo(fd: FormData) {
  const id = int(fd, "id");
  await attempt(`/admin/boutique/achats/${id}`, async () => {
    const received: { line_id: number; qty: number }[] = [];
    for (const [k, v] of fd.entries()) {
      const m = /^recv_(\d+)$/.exec(k);
      if (m && String(v).trim() !== "") received.push({ line_id: Number(m[1]), qty: Number(v) });
    }
    await receivePurchaseOrder(id, received, await getActor());
    refreshStock();
    return "Réception enregistrée et stock mis à jour.";
  });
}
