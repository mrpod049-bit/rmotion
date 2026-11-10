import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendNotification } from '@/lib/notify';
import { verifyTurnstile } from '@/lib/turnstile';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nom, email, sujet, message, turnstileToken } = body;

  if (!nom || !email || !message) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  const clientIp = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || undefined;
  if (!(await verifyTurnstile(turnstileToken, clientIp))) {
    return NextResponse.json({ error: 'Vérification anti-spam échouée' }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO contacts (nom, email, sujet, message) VALUES ($1, $2, $3, $4)`,
    [nom, email, sujet || null, message]
  );

  await sendNotification(
    'Nouveau message de contact — Rmotion',
    [
      { label: 'Nom', value: nom },
      { label: 'Email', value: email },
      { label: 'Sujet', value: sujet || '—' },
      { label: 'Message', value: message },
    ],
    email
  );

  return NextResponse.json({ success: true });
}
