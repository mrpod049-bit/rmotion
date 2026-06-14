import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nom, email, sujet, message } = body;

  if (!nom || !email || !message) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO contacts (nom, email, sujet, message) VALUES ($1, $2, $3, $4)`,
    [nom, email, sujet || null, message]
  );

  return NextResponse.json({ success: true });
}
