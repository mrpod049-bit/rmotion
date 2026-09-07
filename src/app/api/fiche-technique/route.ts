import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendNotification } from '@/lib/notify';

// Demande de fiche technique d'une machine (aimant à leads).
// Enregistre la demande + notifie contact@rmotion.fr. Envoi de la fiche manuel.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, nom, machine_id, machine_name, machine_slug, attribution } = body;

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRe.test(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  const a = (attribution ?? {}) as Record<string, string | undefined>;

  await pool.query(
    `INSERT INTO ft_requests (
       email, nom, machine_id, machine_name, machine_slug,
       gclid, utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_page, referrer)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      email, nom || null, machine_id || null, machine_name || null, machine_slug || null,
      a.gclid || null, a.utm_source || null, a.utm_medium || null, a.utm_campaign || null,
      a.utm_term || null, a.utm_content || null, a.landing_page || null, a.referrer || null,
    ]
  );

  await sendNotification(
    'Nouvelle demande de fiche technique — Rmotion',
    [
      { label: 'Machine', value: machine_name || machine_slug || '—' },
      { label: 'Email', value: email },
      { label: 'Nom', value: nom || '—' },
      { label: 'Source', value: a.gclid ? `Google Ads${a.utm_campaign ? ' · ' + a.utm_campaign : ''}` : (a.utm_source || 'Direct / Organique') },
    ],
    email
  );

  return NextResponse.json({ success: true });
}
