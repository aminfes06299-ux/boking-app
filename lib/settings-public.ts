import { createClient } from '@supabase/supabase-js';

// Réglages affichables publiquement (délai d'annulation, contact). Valeurs de secours si la lecture échoue.
export async function publicSettings() {
  const out = { cancelHours: 24, contact: '' };
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { data } = await sb.from('app_settings').select('cancel_hours,contact_info').eq('id', 1).single();
    if (data?.cancel_hours) out.cancelHours = Number(data.cancel_hours);
    if (data?.contact_info) out.contact = String(data.contact_info).replace(/[\u200e\u200f]/g, '').trim();
  } catch {}
  return out;
}
