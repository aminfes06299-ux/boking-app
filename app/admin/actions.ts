'use server';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverClient } from '@/lib/supabase-server';
import { processOutbox } from '@/lib/outbox';

async function admin() {
  const sb = await serverClient();
  const { data } = await sb.rpc('is_admin');
  if (!data) throw new Error('Accès refusé');
  return sb;
}
const s = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message.includes('slot_unavailable') ? 'Ce créneau est déjà pris.' : e.message); };
const mail = () => after(() => processOutbox().catch(() => {}));

export async function invite(f: FormData) {
  await admin();
  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { error } = await svc.auth.admin.inviteUserByEmail(s(f, 'email').toLowerCase(), { data: { full_name: s(f, 'name') }, redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` });
  fail(error); revalidatePath('/admin/clients');
}
export async function toggleClient(f: FormData) {
  const sb = await admin();
  fail((await sb.from('profiles').update({ active: s(f, 'active') === 'true' }).eq('id', s(f, 'id'))).error);
  revalidatePath('/admin/clients');
}
export async function setStatus(f: FormData) {
  const sb = await admin();
  fail((await sb.rpc('admin_set_status', { p_id: s(f, 'id'), p_status: s(f, 'status') })).error);
  mail(); revalidatePath('/admin');
}
export async function createBooking(f: FormData) {
  const sb = await admin();
  fail((await sb.rpc('admin_create_booking', { p_client: s(f, 'client'), p_local: s(f, 'when') })).error);
  mail(); revalidatePath('/admin');
}
export async function addException(f: FormData) {
  const sb = await admin();
  fail((await sb.rpc('admin_add_exception', { p_kind: s(f, 'kind'), p_from: s(f, 'from'), p_to: s(f, 'to'), p_note: s(f, 'note') })).error);
  revalidatePath('/admin/availability');
}
export async function delException(f: FormData) {
  const sb = await admin();
  fail((await sb.from('exceptions').delete().eq('id', s(f, 'id'))).error);
  revalidatePath('/admin/availability');
}
export async function saveWeekly(f: FormData) {
  const sb = await admin();
  for (let d = 0; d < 7; d++)
    fail((await sb.from('weekly_availability').update({ active: f.get(`a${d}`) === 'on', start_time: s(f, `s${d}`), end_time: s(f, `e${d}`) }).eq('weekday', d)).error);
  revalidatePath('/admin/availability');
}
export async function saveSettings(f: FormData) {
  const sb = await admin();
  fail((await sb.from('app_settings').update({
    notify_email: s(f, 'notify_email'), contact_info: s(f, 'contact_info'), confirmation_message: s(f, 'confirmation_message'),
    min_notice_hours: +s(f, 'min_notice_hours'), horizon_days: +s(f, 'horizon_days'), cancel_hours: +s(f, 'cancel_hours'),
  }).eq('id', 1)).error);
  revalidatePath('/admin/settings');
}
export async function retryEmails() { await admin(); await processOutbox(); revalidatePath('/admin'); }
