import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Upload d'image pour les fiches produits -> Vercel Blob.
// Chemin sous /admin -> protégé par l'auth basique du middleware.
export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024; // 4 Mo (marge sous la limite plateforme Vercel)

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Stockage d'images non configuré (BLOB_READ_WRITE_TOKEN manquant)." },
      { status: 500 }
    );
  }
  let file: FormDataEntryValue | null;
  try {
    const form = await req.formData();
    file = form.get("file");
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image trop lourde (max 4 Mo)" }, { status: 400 });

  try {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase() || "image.jpg";
    const blob = await put(`produits/${safe}`, file, { access: "public", addRandomSuffix: true });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Échec de l'upload" }, { status: 500 });
  }
}
