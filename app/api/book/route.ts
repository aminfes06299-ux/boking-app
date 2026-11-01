import { NextResponse, after } from 'next/server';
import { serverClient } from '@/lib/supabase-server';
import { processOutbox } from '@/lib/outbox';

export async function POST(req: Request) {
  const { start } = await req.json().catch(() => ({}));
  if (!start || Number.isNaN(Date.parse(start))) return NextResponse.json({ error: 'Créneau invalide.' }, { status: 400 });
  const sb = await serverClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Veuillez vous reconnecter.' }, { status: 401 });

  const { data, error } = await sb.rpc('book_slot', { p_start: new Date(start).toISOString() });
  if (error) {
    const m = error.message;
    if (m.includes('slot_unavailable')) return NextResponse.json({ error: "Ce créneau vient d'être pris ou n'est plus disponible. Merci d'en choisir un autre." }, { status: 409 });
    if (m.includes('not_allowed')) return NextResponse.json({ error: "Votre accès n'est pas actif. Merci de me contacter." }, { status: 403 });
    return NextResponse.json({ error: 'Un problème technique est survenu. Merci de réessayer.' }, { status: 500 });
  }
  after(() => processOutbox().catch(() => {}));
  return NextResponse.json({ id: data });
}
