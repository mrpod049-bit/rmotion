import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { SHOP_TAGS } from "@/lib/shop/catalog";

// Utilitaires partagés par les actions serveur de l'admin boutique.

export async function getActor(): Promise<string> {
  try {
    const auth = (await headers()).get("authorization");
    if (auth?.startsWith("Basic ")) {
      const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
      const user = decoded.slice(0, decoded.indexOf(":"));
      if (user) return user;
    }
  } catch {
    /* défaut ci-dessous */
  }
  return process.env.ADMIN_USER || "admin";
}

/** Redirige vers `path` avec un message (affiché par <Flash>). */
export function back(path: string, msg: { ok?: string; err?: string }): never {
  const sep = path.includes("?") ? "&" : "?";
  const q = msg.err ? `err=${encodeURIComponent(msg.err)}` : `ok=${encodeURIComponent(msg.ok ?? "Enregistré.")}`;
  redirect(`${path}${sep}${q}`);
}

/** Exécute une action ; en cas d'erreur métier, revient sur la page avec le message. */
export async function attempt(path: string, fn: () => Promise<string | void>): Promise<never> {
  let ok: string | void;
  try {
    ok = await fn();
  } catch (e) {
    back(path, { err: (e as Error).message || "Erreur inattendue." });
  }
  back(path, { ok: ok || "Enregistré." });
}

// updateTag = expiration immédiate (la page suivante relit la base), contrairement
// à revalidateTag(…, "max") qui servirait encore une fois l'ancienne version.
export const refreshCatalog = () => updateTag(SHOP_TAGS.catalog);
export const refreshStock = () => updateTag(SHOP_TAGS.stock);

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const num = (fd: FormData, k: string) => {
  const v = str(fd, k).replace(",", ".");
  return v === "" ? NaN : Number(v);
};
export const int = (fd: FormData, k: string) => {
  const n = num(fd, k);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
};
