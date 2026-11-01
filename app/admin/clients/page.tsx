import { serverClient } from '@/lib/supabase-server';
import { invite, toggleClient } from '../actions';

export default async function Clients() {
  const { data } = await (await serverClient()).from('profiles').select('id,full_name,email,active,role').order('created_at', { ascending: false });
  return (
    <>
      <h1 className="text-2xl font-semibold">Clients</h1>
      <form action={invite} className="card mt-6 grid gap-3 sm:grid-cols-3">
        <input name="name" placeholder="Nom" className="inp" />
        <input name="email" type="email" required placeholder="E-mail" className="inp" />
        <button className="btn">Envoyer l'invitation</button>
      </form>
      <ul className="card mt-6 divide-y divide-stone-200 p-0">
        {data?.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 p-4 text-sm">
            <span><b>{c.full_name || '—'}</b>{c.role === 'admin' && ' (admin)'}<br /><span className="text-stone-500">{c.email}</span></span>
            {c.role !== 'admin' && (
              <form action={toggleClient}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="active" value={String(!c.active)} />
                <button className="btn2">{c.active ? 'Désactiver' : 'Réactiver'}</button></form>)}
          </li>))}
      </ul>
    </>
  );
}
