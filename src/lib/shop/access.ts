import "server-only";
import { cookies } from "next/headers";
import { PREVIEW_COOKIE, isPreviewValue, shopIsOpen } from "./preview";

/** true si le visiteur peut voir la boutique : ouverte au public, ou aperçu admin. */
export async function canSeeShop(): Promise<boolean> {
  if (shopIsOpen()) return true;
  return isPreviewValue((await cookies()).get(PREVIEW_COOKIE)?.value);
}

/** true si le visiteur est en mode aperçu (boutique fermée au public). */
export async function inPreview(): Promise<boolean> {
  return !shopIsOpen() && (await canSeeShop());
}
