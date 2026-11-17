import { NextRequest, NextResponse } from "next/server";
import { canSeeShop } from "@/lib/shop/access";
import { lookupSiret, cleanSiret, siretValid } from "@/lib/shop/company";

// Pré-remplissage du formulaire d'inscription à partir du SIRET (annuaire public).
export async function GET(req: NextRequest) {
  if (!(await canSeeShop())) return NextResponse.json({ error: "Indisponible" }, { status: 404 });
  const siret = cleanSiret(req.nextUrl.searchParams.get("siret") || "");
  if (!siretValid(siret)) return NextResponse.json({ error: "SIRET invalide (14 chiffres)." }, { status: 400 });
  const r = await lookupSiret(siret);
  if (!r) return NextResponse.json({ error: "SIRET introuvable dans l'annuaire (vous pouvez compléter à la main)." }, { status: 404 });
  return NextResponse.json(r, { headers: { "Cache-Control": "private, max-age=3600" } });
}
