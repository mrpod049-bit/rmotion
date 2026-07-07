import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendNotification } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nom, societe, email, telephone, machine_id, machine_name, message } = body;

  if (!nom || !email || !message) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO devis_requests (nom, societe, email, telephone, machine_id, machine_name, message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [nom, societe, email, telephone, machine_id || null, machine_name || null, message]
  );

  await sendNotification(
    'Nouvelle demande de devis — Rmotion',
    [
      { label: 'Nom', value: nom },
      { label: 'Société', value: societe || '—' },
      { label: 'Email', value: email },
      { label: 'Téléphone', value: telephone || '—' },
      { label: 'Machine', value: machine_name || '—' },
      { label: 'Message', value: message },
    ],
    email
  );

  return NextResponse.json({ success: true });
}
