import { NextResponse, after } from 'next/server';
import { serverClient } from '@/lib/supabase-server';
import { processOutbox } from '@/lib/outbox';
export async function POST(req: Request) {
  const { id } = await req.json().catch(() => ({}));
  const { error } = await (await serverClient()).rpc('cancel_booking', { p_id: id });
  if (error) return NextResponse.json({ error: "Annulation impossible : le délai d'annulation est dépassé." }, { status: 409 });
  after(() => processOutbox().catch(() => {}));
  return NextResponse.json({ ok: true });
}
