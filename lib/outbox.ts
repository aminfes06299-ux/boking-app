import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const fmt = (d: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Casablanca', ...o }).format(new Date(d));
// Envoi par Gmail (SMTP) si GMAIL_USER et GMAIL_APP_PASSWORD sont définis ; sinon Resend.
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;
const smtp = gmailUser && gmailPass
  ? nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: gmailUser, pass: gmailPass } })
  : null;

const icsDate = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
// Fichier calendrier (.ics) joint à l'e-mail de confirmation
function makeIcs(b: { ref: string; starts_at: string; ends_at: string }, summary: string, description: string) {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Coach El Morabit//Reservation//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${b.ref}@coach-el-morabit`, `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(b.starts_at)}`, `DTEND:${icsDate(b.ends_at)}`,
    `SUMMARY:${icsText(summary)}`, `DESCRIPTION:${icsText(description)}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

async function sendMail(to: string, subject: string, html: string, ics?: string) {
  if (smtp) {
    const from = process.env.EMAIL_FROM || `"Coach El Morabit" <${gmailUser}>`;
    await smtp.sendMail({
      from, to, subject, html,
      ...(ics ? { attachments: [{ filename: 'seance.ics', content: ics, contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }] } : {}),
    });
    return;
  }
  if (!process.env.RESEND_API_KEY) throw new Error('Aucun service e-mail configuré (GMAIL_USER/GMAIL_APP_PASSWORD ou RESEND_API_KEY)');
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.EMAIL_FROM!, to, subject, html });
  if (error) throw new Error(error.message);
}


const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://boking-app-coach-el-morabit.vercel.app';
const esc = (s: string) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

// Habillage commun des e-mails (mise en page « table » compatible Gmail, Outlook, Apple Mail)
function shell(preheader: string, heading: string, inner: string, button?: { label: string; href: string }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#F3FAF8">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3FAF8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #D5E5E8;border-radius:16px;overflow:hidden;font-family:Inter,'Segoe UI',Arial,sans-serif;color:#1D2B3A">
<tr><td style="background:#12355B;padding:28px 32px;text-align:center">
<div dir="rtl" style="font-family:Amiri,'Traditional Arabic',Georgia,serif;font-size:30px;font-weight:bold;color:#ffffff;line-height:1.3">أمين المرابط</div>
<div dir="rtl" style="font-family:Amiri,'Traditional Arabic',Georgia,serif;font-size:14px;color:#C4ECEF;margin-top:6px;line-height:1.8">استشاري المرافقة النفسية والدعم السلوكي ومستشار العلاقات الزوجية والأسرية</div>
</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#12355B">${heading}</h1>
${inner}
${button ? `<p style="margin:28px 0 0"><a href="${button.href}" style="display:inline-block;background:#0B7C88;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 22px;border-radius:10px">${button.label}</a></p>` : ''}
</td></tr>
<tr><td style="padding:18px 32px 26px;border-top:1px solid #E3EDEF;font-size:12px;color:#5B6B7A;line-height:1.6">Coach El Morabit · Message confidentiel, destiné uniquement à son destinataire.</td></tr>
</table></td></tr></table></body></html>`;
}

// Bloc d'informations (date, horaire, référence…)
const details = (rows: [string, string][]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E3F4F2;border-radius:12px;margin:12px 0 0"><tr><td style="padding:18px 20px 6px">${rows
    .map(([k, v]) => `<div style="font-size:12px;letter-spacing:.8px;text-transform:uppercase;color:#085F69">${k}</div><div style="font-size:17px;font-weight:600;color:#12355B;margin:2px 0 14px">${v}</div>`)
    .join('')}</td></tr></table>`;
const para = (t: string) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.6">${t}</p>`;

const LABEL: Record<string, string> = { confirmed: 'confirmée', cancelled: 'annulée', changed: 'modifiée', reminder: 'prévue' };

// Envoie les e-mails en attente. Si l'envoi échoue, la réservation reste intacte et la ligne sera retentée (5 essais max).
export async function processOutbox() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: st } = await sb.from('app_settings').select('*').eq('id', 1).single();
  const { data: jobs } = await sb.from('email_outbox')
    .select('*, booking:bookings(*, client:profiles(full_name,email,phone))')
    .in('status', ['pending', 'failed']).lt('attempts', 5).order('created_at').limit(20);

  for (const j of jobs ?? []) {
    try {
      const b = j.booking, c = b.client;
      const [event, who] = j.kind.split('_');
      const date = fmt(b.starts_at, { dateStyle: 'full' });
      const t1 = fmt(b.starts_at, { timeStyle: 'short' }), t2 = fmt(b.ends_at, { timeStyle: 'short' });
      const name = c.full_name || c.email;
      const toClient = who === 'client';
      const to = toClient ? c.email : st?.notify_email;
      if (!to) throw new Error('Adresse de destination absente');
      const subject = event === 'reminder'
        ? `Rappel : votre séance de demain à ${t1}`
        : toClient
        ? `Votre séance du ${date} est ${LABEL[event]}`
        : event === 'confirmed'
          ? `Nouvelle réservation de séance – ${name} – ${date} à ${t1}`
          : `Séance ${LABEL[event]} – ${name} – ${date} à ${t1}`;
      const phone = st?.contact_info ? esc(String(st.contact_info).replace(/[\u200e\u200f]/g, '').trim()) : '';
      const info = details([['Date', date.charAt(0).toUpperCase() + date.slice(1)], ['Horaire', `${t1} – ${t2} · 60 min`], ['Référence', esc(b.ref)]]);
      const hello = para(`Bonjour ${esc(name)},`);
      const html = event === 'reminder'
        ? shell(`Votre séance a lieu demain à ${t1}`, 'Rappel : votre séance a lieu demain', `${hello}${para('Un petit rappel de votre prochaine séance.')}${info}${phone ? para(`<span style="display:block;margin-top:16px">En cas d’empêchement, contactez-moi au <b>${phone}</b>.</span>`) : ''}`, { label: 'Accéder à mon espace', href: SITE })
        : toClient
        ? shell(`Votre séance du ${date} est ${LABEL[event]}`, `Votre séance est ${LABEL[event]}`, `${hello}${para(event === 'confirmed' ? 'Votre réservation est bien enregistrée. Voici les détails :' : 'Voici le récapitulatif :')}${info}${st?.confirmation_message ? `<p style="margin:16px 0 0;font-size:15px;line-height:1.6;white-space:pre-line">${esc(st.confirmation_message)}</p>` : ''}${event === 'confirmed' ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#5B6B7A">Annulation possible jusqu’à ${esc(String(st?.cancel_hours ?? 24))} h avant la séance, depuis votre espace. Un fichier calendrier est joint à ce message.</p>` : ''}`, { label: 'Accéder à mon espace', href: SITE })
        : shell(`${name} · ${date} à ${t1}`, event === 'confirmed' ? 'Nouvelle réservation' : `Séance ${LABEL[event]}`, `${details([['Client', `${esc(name)}`], ['E-mail', esc(c.email)], ...(c.phone ? [['Téléphone', esc(c.phone)] as [string, string]] : [])])}${info}`, { label: 'Ouvrir l’espace administrateur', href: `${SITE}/admin` });
      const ics = toClient && event === 'confirmed'
        ? makeIcs(b, 'Séance – Coach El Morabit', `Séance de 60 minutes. Réf. ${b.ref}`)
        : undefined;
      await sendMail(to, subject, html, ics);
      await sb.from('email_outbox').update({ status: 'sent', attempts: j.attempts + 1, last_error: null }).eq('id', j.id);
    } catch (e: any) {
      await sb.from('email_outbox').update({ status: 'failed', attempts: j.attempts + 1, last_error: String(e.message ?? e) }).eq('id', j.id);
    }
  }
}
