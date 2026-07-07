import { NextRequest, NextResponse } from "next/server";

// Protège /admin par une authentification basique (identifiant + mot de passe).
// Les identifiants sont lus depuis les variables d'environnement
// ADMIN_USER et ADMIN_PASSWORD. Sans mot de passe configuré, l'accès est refusé.

export function middleware(req: NextRequest) {
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
        return NextResponse.next();
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

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
