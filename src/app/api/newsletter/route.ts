import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendNotification } from "@/lib/notify";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });

  const email = String(body.email || "").trim().toLowerCase();
  const consent = body.consent === true;
  const source = typeof body.source === "string" ? body.source.slice(0, 50) : "popup";
  const productSlug = typeof body.productSlug === "string" ? body.productSlug.slice(0, 200) : null;
  const fbclid = typeof body.fbclid === "string" ? body.fbclid.slice(0, 500) : null;

  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  if (!consent) return NextResponse.json({ error: "Consentement requis" }, { status: 400 });

  // ON CONFLICT : une même adresse ne s'inscrit qu'une fois (rowCount = 0 si déjà là).
  const res = await pool.query(
    `INSERT INTO newsletter_subscribers (email, source, product_slug, fbclid, consent)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [email, source, productSlug, fbclid]
  );

  if ((res.rowCount ?? 0) > 0) {
    await sendNotification("Nouvelle inscription newsletter — Rmotion", [
      { label: "Email", value: email },
      { label: "Source", value: source },
      { label: "Page", value: productSlug || "—" },
    ]);
  }

  return NextResponse.json({ success: true, alreadySubscribed: (res.rowCount ?? 0) === 0 });
}
