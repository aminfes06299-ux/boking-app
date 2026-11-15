import { NextResponse, after } from 'next/server';
import { serverClient } from '@/lib/supabase-server';
import { processOutbox } from '@/lib/outbox';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const { start, name: rawName } = await req.json().catch(() => ({} as any));
  if (!start || Number.isNaN(Date.parse(start))) return NextResponse.json({ error: 'Créneau invalide.' }, { status: 400 });
  const sb = await serverClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Veuillez vous reconnecter.' }, { status: 401 });

  // Nom du client : obligatoire, nettoyé, enregistré sur son profil (seule colonne modifiée : full_name)
  const name = (typeof rawName === 'string' ? rawName : '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (name.length < 2) return NextResponse.json({ error: 'Merci d’indiquer votre nom complet.' }, { status: 400 });
  try {
    const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    await svc.from('profiles').update({ full_name: name }).eq('id', user.id);
  } catch {}

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
