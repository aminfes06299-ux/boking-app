import { NextResponse } from 'next/server';
import { processOutbox } from '@/lib/outbox';

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('Forbidden', { status: 403 });
  await processOutbox();
  return NextResponse.json({ ok: true });
}
