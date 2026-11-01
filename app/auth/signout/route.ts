import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase-server';
export async function POST(req: Request) {
  await (await serverClient()).auth.signOut();
  return NextResponse.redirect(new URL('/login', req.url), 303);
}
