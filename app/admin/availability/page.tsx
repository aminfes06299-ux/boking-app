import { serverClient } from '@/lib/supabase-server';
import { fmtDate, fmtTime } from '@/lib/format';
import { saveWeekly, addException, delException } from '../actions';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default async function Availability() {
  const sb = await serverClient();
  const { data: week } = await sb.from('weekly_availability').select('*').order('weekday');
  const { data: exc } = await sb.from('exceptions').select('*').gte('ends_at', new Date().toISOString()).order('starts_at');
  return (
    <>
      <h1 className="text-2xl font-semibold">Disponibilités</h1>
      <form action={saveWeekly} className="card mt-6 space-y-2">
        {week?.map((w) => (
          <div key={w.weekday} className="flex items-center gap-3 text-sm">
            <label className="flex w-32 items-center gap-2"><input type="checkbox" name={`a${w.weekday}`} defaultChecked={w.active} />{DAYS[w.weekday]}</label>
            <input type="time" name={`s${w.weekday}`} defaultValue={w.start_time.slice(0, 5)} className="inp w-28" />
            <input type="time" name={`e${w.weekday}`} defaultValue={w.end_time.slice(0, 5)} className="inp w-28" />
          </div>))}
        <button className="btn mt-3">Enregistrer</button>
      </form>

      <h2 className="mt-10 font-medium">Congés, blocages et ouvertures exceptionnelles</h2>
      <form action={addException} className="card mt-3 grid gap-3 sm:grid-cols-5">
        <select name="kind" className="inp"><option value="block">Bloquer</option><option value="open">Ouvrir</option></select>
        <input type="datetime-local" name="from" required className="inp" />
        <input type="datetime-local" name="to" required className="inp" />
        <input name="note" placeholder="Note" className="inp" />
        <button className="btn">Ajouter</button>
      </form>
      <ul className="card mt-4 divide-y divide-stone-200 p-0">
        {!exc?.length && <li className="p-4 text-sm text-stone-500">Aucune exception à venir.</li>}
        {exc?.map((e) => (
          <li key={e.id} className="flex items-center justify-between p-4 text-sm">
            <span>{e.kind === 'block' ? '⛔ Bloqué' : '✅ Ouvert'} · {fmtDate(e.starts_at)} {fmtTime(e.starts_at)} → {fmtDate(e.ends_at)} {fmtTime(e.ends_at)} {e.note && `· ${e.note}`}</span>
            <form action={delException}><input type="hidden" name="id" value={e.id} /><button className="btn2">Supprimer</button></form>
          </li>))}
      </ul>
    </>
  );
}
