"use server";
import pool from "@/lib/db";
import { cancelOrder, createReturn, markPaid, orderEvent, receiveReturn, setStatus, shipOrder } from "@/lib/shop/orders";
import { attempt, getActor, refreshStock, str, int } from "../_server";

const path = (id: number) => `/admin/boutique/commandes/${id}`;

export async function toPreparing(fd: FormData) {
  const id = int(fd, "id");
  await attempt(path(id), async () => { await setStatus(id, "preparing", await getActor()); return "Commande en préparation."; });
}

export async function toShipped(fd: FormData) {
  const id = int(fd, "id");
  await attempt(path(id), async () => {
    await shipOrder(id, str(fd, "carrier"), str(fd, "tracking"), await getActor());
    return "Commande expédiée — le client a été prévenu par email.";
  });
}

export async function toDelivered(fd: FormData) {
  const id = int(fd, "id");
  await attempt(path(id), async () => { await setStatus(id, "delivered", await getActor()); return "Commande livrée."; });
}

export async function registerPayment(fd: FormData) {
  const id = int(fd, "id");
  await attempt(path(id), async () => { await markPaid(id, null, await getActor()); return "Règlement enregistré."; });
}

export async function cancel(fd: FormData) {
  const id = int(fd, "id");
  await attempt(path(id), async () => {
    await cancelOrder(id, str(fd, "reason"), fd.get("refund") != null, await getActor());
    refreshStock();
    return "Commande annulée, stock remis à disposition.";
  });
}

export async function addNote(fd: FormData) {
  const id = int(fd, "id");
  await attempt(path(id), async () => {
    const note = str(fd, "note");
    if (!note) throw new Error("Note vide.");
    await orderEvent(pool, id, "note", note, await getActor());
    return "Note ajoutée.";
  });
}

export async function openReturn(fd: FormData) {
  const id = int(fd, "id");
  await attempt(path(id), async () => {
    const items: { order_line_id: number; qty: number }[] = [];
    for (const [k, v] of fd.entries()) {
      const m = /^ret_(\d+)$/.exec(k);
      if (m && Number(v) > 0) items.push({ order_line_id: Number(m[1]), qty: Math.trunc(Number(v)) });
    }
    const n = await createReturn(id, items, str(fd, "reason"), fd.get("restock") != null, await getActor());
    return `Retour ${n} ouvert. Validez sa réception à l'arrivée du colis.`;
  });
}

export async function closeReturn(fd: FormData) {
  const rid = int(fd, "return_id");
  const back = str(fd, "back") || "/admin/boutique/retours";
  await attempt(back, async () => {
    await receiveReturn(rid, await getActor());
    refreshStock();
    return "Retour réceptionné.";
  });
}

export async function cancelReturn(fd: FormData) {
  const rid = int(fd, "return_id");
  await attempt(str(fd, "back") || "/admin/boutique/retours", async () => {
    await pool.query("UPDATE shop_returns SET status='cancelled' WHERE id=$1 AND status='open'", [rid]);
    return "Retour annulé.";
  });
}
