import { serverClient } from '@/lib/supabase-server';
import { fmtDate, fmtTime } from '@/lib/format';
import { setStatus, createBooking, retryEmails } from './actions';

const ST: Record<string, string> = { confirmed: 'Confirmé', cancelled: 'Annulé', completed: 'Réalisé' };

export default async function Admin() {
  const sb = await serverClient();
  const { data: rows } = await sb.from('bookings').select('id,ref,starts_at,ends_at,status,client:profiles(full_name,email)').order('starts_at', { ascending: false }).limit(100);
  const { data: clients } = await sb.from('profiles').select('id,full_name,email').eq('role', 'client').eq('active', true).order('full_name');
  const { count } = await sb.from('email_outbox').select('*', { count: 'exact', head: true }).eq('status', 'failed');
  return (
    <>
      <h1 className="text-2xl font-semibold">Rendez-vous</h1>
      {!!count && (
        <form action={retryEmails} className="mt-4 rounded-xl bg-amber-50 p-3 text-sm">
          {count} e-mail(s) non envoyé(s). <button className="underline">Réessayer l'envoi</button>
        </form>
      )}
      <form action={createBooking} className="card mt-6 grid gap-3 sm:grid-cols-3">
        <select name="client" required className="inp"><option value="">Client…</option>{clients?.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}</select>
        <input name="when" type="datetime-local" step={3600} required className="inp" />
        <button className="btn">Créer le rendez-vous</button>
      </form>
      <ul className="card mt-6 divide-y divide-stone-200 p-0">
        {!rows?.length && <li className="p-4 text-sm text-stone-500">Aucun rendez-vous.</li>}
        {(rows as any[] | null)?.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <span><b>{b.client?.full_name || b.client?.email}</b><br /><span className="capitalize">{fmtDate(b.starts_at)}</span> · {fmtTime(b.starts_at)}–{fmtTime(b.ends_at)} · {b.ref}</span>
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-[#E8EEE6] px-3 py-1 text-xs">{ST[b.status]}</span>
              {b.status === 'confirmed' && ['completed', 'cancelled'].map((st) => (
                <form key={st} action={setStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value={st} />
                  <button className="btn2">{st === 'completed' ? 'Réalisée' : 'Annuler'}</button></form>))}
            </span>
          </li>))}
      </ul>
    </>
  );
}
