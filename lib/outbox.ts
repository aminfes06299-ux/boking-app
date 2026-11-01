import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const fmt = (d: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Casablanca', ...o }).format(new Date(d));
const LABEL: Record<string, string> = { confirmed: 'confirmée', cancelled: 'annulée', changed: 'modifiée' };

// Envoie les e-mails en attente. Si l'envoi échoue, la réservation reste intacte et la ligne sera retentée (5 essais max).
export async function processOutbox() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: st } = await sb.from('app_settings').select('*').eq('id', 1).single();
  const { data: jobs } = await sb.from('email_outbox')
    .select('*, booking:bookings(*, client:profiles(full_name,email,phone))')
    .in('status', ['pending', 'failed']).lt('attempts', 5).order('created_at').limit(20);

  for (const j of jobs ?? []) {
    try {
      if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY manquante');
      const b = j.booking, c = b.client;
      const [event, who] = j.kind.split('_');
      const date = fmt(b.starts_at, { dateStyle: 'full' });
      const t1 = fmt(b.starts_at, { timeStyle: 'short' }), t2 = fmt(b.ends_at, { timeStyle: 'short' });
      const name = c.full_name || c.email;
      const toClient = who === 'client';
      const to = toClient ? c.email : st?.notify_email;
      if (!to) throw new Error('Adresse de destination absente');
      const subject = toClient
        ? `Votre séance du ${date} est ${LABEL[event]}`
        : event === 'confirmed'
          ? `Nouvelle réservation de séance – ${name} – ${date} à ${t1}`
          : `Séance ${LABEL[event]} – ${name} – ${date} à ${t1}`;
      const rows = `<p><b>Date :</b> ${date}<br><b>Horaire :</b> ${t1} – ${t2} (60 min)<br><b>Identifiant :</b> ${b.ref}<br><b>Statut :</b> ${b.status}</p>`;
      const html = toClient
        ? `<p>Bonjour ${name},</p><p>Votre séance est ${LABEL[event]}.</p>${rows}<p>${st?.confirmation_message ?? ''}</p><p>Annulation possible jusqu'à ${st?.cancel_hours} h avant la séance depuis votre espace.</p>`
        : `<p>Client : ${name} (${c.email})${c.phone ? ' — ' + c.phone : ''}</p>${rows}`;
      const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.EMAIL_FROM!, to, subject, html });
      if (error) throw new Error(error.message);
      await sb.from('email_outbox').update({ status: 'sent', attempts: j.attempts + 1, last_error: null }).eq('id', j.id);
    } catch (e: any) {
      await sb.from('email_outbox').update({ status: 'failed', attempts: j.attempts + 1, last_error: String(e.message ?? e) }).eq('id', j.id);
    }
  }
}
