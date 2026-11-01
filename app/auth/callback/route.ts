import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase-server';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (code) await (await serverClient()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL('/', url.origin));
}
