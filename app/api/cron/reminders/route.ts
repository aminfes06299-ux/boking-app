import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processOutbox } from '@/lib/outbox';
import { localDay } from '@/lib/format';

// Appelé chaque jour par Vercel Cron : prépare le rappel e-mail des séances de demain (heure du Maroc), puis envoie.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const now = Date.now();
  const tomorrow = localDay(new Date(now + 864e5));

  const { data: bookings } = await sb.from('bookings').select('id,starts_at')
    .eq('status', 'confirmed').gte('starts_at', new Date(now).toISOString()).lt('starts_at', new Date(now + 2 * 864e5).toISOString());
  const due = (bookings ?? []).filter((b) => localDay(new Date(b.starts_at)) === tomorrow);

  let created = 0;
  if (due.length) {
    const { data: already } = await sb.from('email_outbox').select('booking_id').eq('kind', 'reminder_client').in('booking_id', due.map((b) => b.id));
    const done = new Set((already ?? []).map((r) => r.booking_id));
    const rows = due.filter((b) => !done.has(b.id)).map((b) => ({ kind: 'reminder_client', booking_id: b.id }));
    if (rows.length) { await sb.from('email_outbox').insert(rows); created = rows.length; }
  }
  await processOutbox();
  return NextResponse.json({ ok: true, reminders: created });
}
