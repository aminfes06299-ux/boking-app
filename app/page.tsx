import Link from 'next/link';
import { serverClient } from '@/lib/supabase-server';
import { fmtDate, fmtTime } from '@/lib/format';
import { tr, type Key } from '@/lib/i18n';
import { getLang } from '@/lib/lang-server';
import CancelButton from './CancelButton';

const STATUS: Record<string, Key> = { confirmed: 'stConfirmed', cancelled: 'stCancelled', completed: 'stDone' };

export default async function Home() {
  const lang = await getLang();
  const t = (k: Key, v?: Record<string, string | number>) => tr(lang, k, v);
  const sb = await serverClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: me } = await sb.from('profiles').select('full_name,email,active,role').eq('id', user!.id).single();
  const { data: all } = await sb.from('bookings').select('id,ref,starts_at,ends_at,status').order('starts_at', { ascending: false });
  const { count: nbRes } = await sb.from('resources').select('id', { count: 'exact', head: true });
  const now = Date.now();
  const upcoming = (all ?? []).filter((b) => b.status === 'confirmed' && new Date(b.starts_at).getTime() > now).reverse();
  const next = upcoming[0];

  return (
    <>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-navy">{me?.full_name ? t('helloNamed', { name: me.full_name }) : t('hello')}</h1>
          <p className="mt-1 text-muted">{t('homeSub')}</p>
        </div>
        <form action="/auth/signout" method="post"><button className="text-sm text-muted underline">{t('logout')}</button></form>
      </header>

      <div className="mt-8 grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl bg-navy p-7 text-white">
          <p className="text-xs uppercase tracking-widest text-[#9ED8DD]">{t('nextSession')}</p>
          {next ? (
            <>
              <p className="mt-3 text-2xl font-semibold capitalize">{fmtDate(next.starts_at, lang)}</p>
              <p className="mt-1 text-lg text-[#C4ECEF]">{fmtTime(next.starts_at, lang)} – {fmtTime(next.ends_at, lang)} · {t('min60')}</p>
              <p className="mt-1 text-xs text-[#9ED8DD]">{t('ref', { ref: next.ref })}</p>
              <CancelButton id={next.id} light />
            </>
          ) : <p className="mt-3 text-lg text-[#C4ECEF]">{t('noNext')}</p>}
        </section>

        <section className="flex flex-col justify-between rounded-3xl border border-line bg-white p-7">
          {me?.active ? (
            <>
              <div>
                <h2 className="text-xl font-semibold text-navy">{t('bookTitle')}</h2>
                <p className="mt-2 text-muted">{t('bookText')}</p>
              </div>
              <Link href="/book" className="mt-5 block rounded-xl bg-teal px-4 py-3.5 text-center font-semibold text-white transition hover:bg-teal-dark">{t('chooseSlot')}</Link>
            </>
          ) : <p className="rounded-xl bg-amber-50 p-4 text-sm">{t('inactive')}</p>}
        </section>
      </div>

      <Link href="/bibliotheque" className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-teal">
        <div>
          <h2 className="text-lg font-semibold text-navy">{t('library')}</h2>
          <p className="mt-1 text-sm text-muted">{t('libraryText')}</p>
        </div>
        {nbRes ? <span className="rounded-full bg-mint px-3 py-1 text-sm font-semibold text-teal-dark">{nbRes}</span> : null}
      </Link>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-navy">{t('yourBookings')}</h2>
        {(all ?? []).length === 0 ? <p className="mt-3 text-sm text-muted">{t('noBookings')}</p> : (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {all!.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <span className="capitalize">{fmtDate(b.starts_at, lang)}<br /><span className="normal-case text-muted">{fmtTime(b.starts_at, lang)} – {fmtTime(b.ends_at, lang)}</span></span>
                <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-teal-dark">{t(STATUS[b.status] ?? 'stConfirmed')}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {me?.role === 'admin' && <Link href="/admin" className="mt-8 block text-center text-sm text-teal underline">{t('adminSpace')}</Link>}
      <p className="mt-10 text-xs text-muted">{t('account', { email: me?.email ?? '' })} · <Link href="/compte" className="underline">{t('passwordLink')}</Link></p>
    </>
  );
}
