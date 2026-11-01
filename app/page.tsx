import Link from 'next/link';
import { serverClient } from '@/lib/supabase-server';
import { fmtDate, fmtTime } from '@/lib/format';
import CancelButton from './CancelButton';

const STATUS: Record<string, string> = { confirmed: 'Confirmé', cancelled: 'Annulé', completed: 'Réalisé' };

export default async function Home() {
  const sb = await serverClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: me } = await sb.from('profiles').select('full_name,email,active,role').eq('id', user!.id).single();
  const { data: all } = await sb.from('bookings').select('id,ref,starts_at,ends_at,status').order('starts_at', { ascending: false });
  const now = Date.now();
  const upcoming = (all ?? []).filter((b) => b.status === 'confirmed' && new Date(b.starts_at).getTime() > now).reverse();
  const next = upcoming[0];

  return (
    <>
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Votre espace de réservation</h1>
          <p className="mt-1 text-sm text-stone-500">Bonjour{me?.full_name ? ` ${me.full_name}` : ''}, vous êtes au bon endroit.</p>
        </div>
        <form action="/auth/signout" method="post"><button className="text-sm text-stone-500 underline">Déconnexion</button></form>
      </header>

      {me?.active ? (
        <Link href="/book" className="mt-8 block rounded-xl bg-[#7A8F7A] px-4 py-4 text-center font-medium text-white transition hover:bg-[#6B7F6B]">Réserver une séance</Link>
      ) : <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm">Votre accès n'est pas actif pour le moment. Merci de me contacter.</p>}

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">Votre prochain rendez-vous</h2>
        {next ? (
          <div className="mt-3 rounded-2xl bg-white/70 p-5 ring-1 ring-stone-200">
            <p className="text-lg font-medium capitalize">{fmtDate(next.starts_at)}</p>
            <p className="text-stone-600">{fmtTime(next.starts_at)} – {fmtTime(next.ends_at)} · 60 min</p>
            <p className="mt-1 text-xs text-stone-400">Réf. {next.ref}</p>
            <CancelButton id={next.id} />
          </div>
        ) : <p className="mt-3 text-sm text-stone-500">Aucun rendez-vous à venir.</p>}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">Vos réservations</h2>
        {(all ?? []).length === 0 ? <p className="mt-3 text-sm text-stone-500">Aucune réservation pour le moment.</p> : (
          <ul className="mt-3 divide-y divide-stone-200 rounded-2xl bg-white/70 ring-1 ring-stone-200">
            {all!.map((b) => (
              <li key={b.id} className="flex items-center justify-between p-4 text-sm">
                <span className="capitalize">{fmtDate(b.starts_at)}<br /><span className="normal-case text-stone-500">{fmtTime(b.starts_at)} – {fmtTime(b.ends_at)}</span></span>
                <span className="rounded-full bg-[#E8EEE6] px-3 py-1 text-xs">{STATUS[b.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {me?.role === 'admin' && <Link href="/admin" className="mt-8 block text-center text-sm underline">Espace administrateur</Link>}
      <p className="mt-10 text-xs text-stone-400">Compte : {me?.email}</p>
    </>
  );
}
