import { NextRequest, NextResponse } from "next/server";
import { PREVIEW_COOKIE, PREVIEW_MAX_AGE, previewToken } from "@/lib/shop/preview";

// Active (ou coupe avec ?off=1) l'aperçu de la boutique pour ce navigateur.
// Sous /admin → protégé par l'authentification basique du middleware.
export async function GET(req: NextRequest) {
  const off = req.nextUrl.searchParams.has("off");
  const res = NextResponse.redirect(new URL(off ? "/admin/boutique" : "/outils", req.url));
  if (off) {
    res.cookies.delete(PREVIEW_COOKIE);
    return res;
  }
  const token = await previewToken();
  if (!token) return NextResponse.json({ error: "Aucun secret configuré (ADMIN_PASSWORD)." }, { status: 500 });
  res.cookies.set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PREVIEW_MAX_AGE,
  });
  return res;
}
