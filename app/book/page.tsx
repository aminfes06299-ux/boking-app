'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { fmtDate, fmtTime, localDay, dayParts } from '@/lib/format';
import { useT } from '@/components/LangProvider';

export default function Book() {
  const { t, lang } = useT();
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => localDay(new Date(Date.now() + i * 864e5))), []);
  const [day, setDay] = useState(days[0]);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [name, setName] = useState('');

  const load = (d: string) => {
    setSlots(null); setSel(null);
    createClient().rpc('get_available_slots', { p_date: d }).then(({ data, error }) => {
      setErr(error ? t('errSlots') : '');
      setSlots((data as string[]) ?? []);
    });
  };
  useEffect(() => load(day), [day]);

  // Pré-remplit le nom s'il est déjà connu
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      sb.from('profiles').select('full_name').eq('id', data.user.id).single().then(({ data: me }) => {
        if (me?.full_name) setName((n) => n || me.full_name);
      });
    });
  }, []);

  async function confirm() {
    setBusy(true); setErr('');
    const r = await fetch('/api/book', { method: 'POST', body: JSON.stringify({ start: sel, name: name.trim() }) });
    setBusy(false);
    if (r.ok) setDone(true); else { setErr((await r.json()).error); load(day); }
  }

  if (done && sel) return (
    <div className="mx-auto mt-6 max-w-xl rounded-3xl border border-line bg-white p-8 text-center">
      <h1 className="text-2xl font-semibold text-navy">{t('confirmedTitle')}</h1>
      <p className="mt-4 text-lg capitalize">{fmtDate(sel, lang)}</p>
      <p className="text-muted">{fmtTime(sel, lang)} · {t('min60')}</p>
      <p className="mt-4 text-sm text-muted">{t('emailSoon')}</p>
      <Link href="/" className="mt-6 block rounded-xl bg-teal px-4 py-3.5 font-semibold text-white hover:bg-teal-dark">{t('backHome')}</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/" className="text-sm text-muted underline">{t('back')}</Link>
      <h1 className="mt-4 text-3xl font-semibold text-navy">{t('chooseSlot')}</h1>
      <div className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-2">
        {days.map((d) => { const p = dayParts(d, lang); const on = d === day; return (
          <button key={d} onClick={() => setDay(d)} className={`min-h-14 min-w-14 rounded-xl px-3 py-2 text-center text-sm ring-1 transition ${on ? 'bg-teal text-white ring-teal' : 'bg-white ring-line hover:ring-teal'}`}>
            <span className="block capitalize">{p.wd}</span><span className="text-lg font-semibold">{p.n}</span>
          </button>); })}
      </div>

      <div className="mt-6">
        {slots === null ? <p className="text-sm text-muted">{t('loadingSlots')}</p>
          : slots.length === 0 ? <p className="rounded-xl border border-line bg-white p-4 text-sm text-muted">{t('noSlots')}</p>
          : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{slots.map((s) => (
              <button key={s} onClick={() => setSel(s)} className={`min-h-12 rounded-xl py-3 text-sm font-semibold ring-1 transition ${sel === s ? 'bg-teal text-white ring-teal' : 'bg-white ring-[#B7CAD3] hover:ring-teal'}`}>{fmtTime(s, lang)}</button>))}</div>}
      </div>

      {err && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{err}</p>}

      {sel && (
        <div className="mt-6 rounded-2xl border border-line bg-white p-5">
          <p className="text-xs uppercase tracking-widest text-muted">{t('recap')}</p>
          <p className="mt-1 text-lg font-semibold capitalize text-navy">{fmtDate(sel, lang)}</p>
          <p className="text-muted">{fmtTime(sel, lang)} · {t('duration')}</p>
          <label className="mt-4 block text-sm text-muted" htmlFor="full-name">{t('fullName')}</label>
          <input id="full-name" required autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePh')} className="inp mt-1" />
          <button onClick={confirm} disabled={busy || name.trim().length < 2} className="btn mt-4 w-full min-h-12 disabled:opacity-60">{busy ? t('confirming') : t('confirmBtn')}</button>
          <p className="mt-3 text-center text-xs text-muted">{t('agreePre')}<Link href="/conditions" className="underline">{t('agreeTerms')}</Link>{t('agreeAnd')}<Link href="/confidentialite" className="underline">{t('agreePrivacy')}</Link>.</p>
        </div>
      )}
    </div>
  );
}
