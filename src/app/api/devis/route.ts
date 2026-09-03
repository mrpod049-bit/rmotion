import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendNotification } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nom, societe, email, telephone, machine_id, machine_name, message, attribution } = body;

  if (!nom || !email || !message) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  const a = (attribution ?? {}) as Record<string, string | undefined>;

  await pool.query(
    `INSERT INTO devis_requests (
       nom, societe, email, telephone, machine_id, machine_name, message,
       gclid, gbraid, wbraid, utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_page, referrer)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      nom, societe, email, telephone, machine_id || null, machine_name || null, message,
      a.gclid || null, a.gbraid || null, a.wbraid || null,
      a.utm_source || null, a.utm_medium || null, a.utm_campaign || null,
      a.utm_term || null, a.utm_content || null, a.landing_page || null, a.referrer || null,
    ]
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
