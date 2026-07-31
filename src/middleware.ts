import { NextRequest, NextResponse } from "next/server";

// Deux rôles :
// 1) Protège /admin par une authentification basique (ADMIN_USER / ADMIN_PASSWORD).
// 2) i18n : détecte la locale depuis l'URL. Le français est servi à la racine
//    (sans préfixe) ; l'anglais vit sous /en et est réécrit en interne vers la
//    même page, la locale étant transmise aux composants via l'en-tête x-locale.

function requireAdminAuth(req: NextRequest): NextResponse | null {
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "";

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(":");
      const user = decoded.slice(0, idx);
      const pass = decoded.slice(idx + 1);
      if (expectedPass !== "" && user === expectedUser && pass === expectedPass) {
        return null; // authentifié
      }
    } catch {
      // en-tête invalide -> on redemande l'auth
    }
  }
  return new NextResponse("Authentification requise", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Rmotion Admin"' },
  });
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const denied = requireAdminAuth(req);
    if (denied) return denied;
    return NextResponse.next();
  }

  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const locale = isEn ? "en" : "fr";
  const headers = new Headers(req.headers);
  headers.set("x-locale", locale);

  if (isEn) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/en/, "") || "/";
    return NextResponse.rewrite(url, { request: { headers } });
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Tout le site sauf les fichiers statiques, images Next et l'API.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)"],
};
