import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendNotification } from '@/lib/notify';
import { sendCapiEvent } from '@/lib/capi';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nom, societe, email, telephone, machine_id, machine_name, message, attribution, eventId, fbc, fbp } = body;

  if (!nom || !email || !message) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  const a = (attribution ?? {}) as Record<string, string | undefined>;

  await pool.query(
    `INSERT INTO devis_requests (
       nom, societe, email, telephone, machine_id, machine_name, message,
       gclid, gbraid, wbraid, utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_page, referrer,
       fbclid, fbc, fbp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
    [
      nom, societe, email, telephone, machine_id || null, machine_name || null, message,
      a.gclid || null, a.gbraid || null, a.wbraid || null,
      a.utm_source || null, a.utm_medium || null, a.utm_campaign || null,
      a.utm_term || null, a.utm_content || null, a.landing_page || null, a.referrer || null,
      a.fbclid || null, fbc || null, fbp || null,
    ]
  );

  // Remontée serveur vers Meta (API de conversions) — même event_id que le Pixel
  // navigateur pour la déduplication. Best-effort : n'interrompt jamais la réponse.
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || undefined;
  const ua = req.headers.get('user-agent') || undefined;
  const referer = req.headers.get('referer') || undefined;
  const origin = req.headers.get('origin') || 'https://rmotion.fr';
  await sendCapiEvent({
    eventName: 'Lead',
    eventId,
    eventSourceUrl: referer || (a.landing_page ? origin + a.landing_page : origin + '/devis'),
    actionSource: 'website',
    userData: { email, phone: telephone, fbc, fbp, ip, userAgent: ua },
    customData: { content_name: machine_name || undefined, value: 25, currency: 'EUR' },
  });

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
