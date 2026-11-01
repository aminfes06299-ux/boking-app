'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { fmtDate, fmtTime, localDay, dayParts } from '@/lib/format';

export default function Book() {
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => localDay(new Date(Date.now() + i * 864e5))), []);
  const [day, setDay] = useState(days[0]);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const load = (d: string) => {
    setSlots(null); setSel(null);
    createClient().rpc('get_available_slots', { p_date: d }).then(({ data, error }) => {
      setErr(error ? 'Impossible de charger les créneaux. Merci de réessayer.' : '');
      setSlots((data as string[]) ?? []);
    });
  };
  useEffect(() => load(day), [day]);

  async function confirm() {
    setBusy(true); setErr('');
    const r = await fetch('/api/book', { method: 'POST', body: JSON.stringify({ start: sel }) });
    setBusy(false);
    if (r.ok) setDone(true); else { setErr((await r.json()).error); load(day); }
  }

  if (done && sel) return (
    <div className="mt-10 rounded-2xl bg-white/70 p-6 text-center ring-1 ring-stone-200">
      <h1 className="text-2xl font-semibold">Réservation confirmée</h1>
      <p className="mt-3 capitalize">{fmtDate(sel)}</p>
      <p className="text-stone-600">{fmtTime(sel)} · 60 min</p>
      <p className="mt-4 text-sm text-stone-500">Un e-mail de confirmation vous sera envoyé.</p>
      <Link href="/" className="mt-6 block rounded-xl bg-[#7A8F7A] px-4 py-3 font-medium text-white">Retour à mon espace</Link>
    </div>
  );

  return (
    <>
      <Link href="/" className="text-sm text-stone-500 underline">← Retour</Link>
      <h1 className="mt-4 text-2xl font-semibold">Choisir un créneau</h1>
      <div className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-2">
        {days.map((d) => { const p = dayParts(d); const on = d === day; return (
          <button key={d} onClick={() => setDay(d)} className={`min-w-14 rounded-xl px-3 py-2 text-center text-sm ring-1 transition ${on ? 'bg-[#7A8F7A] text-white ring-[#7A8F7A]' : 'bg-white/70 ring-stone-200'}`}>
            <span className="block capitalize">{p.wd}</span><span className="text-lg font-medium">{p.n}</span>
          </button>); })}
      </div>

      <div className="mt-6">
        {slots === null ? <p className="text-sm text-stone-500">Chargement…</p>
          : slots.length === 0 ? <p className="rounded-xl bg-white/70 p-4 text-sm text-stone-500 ring-1 ring-stone-200">Aucun créneau libre ce jour-là. Essayez une autre date.</p>
          : <div className="grid grid-cols-3 gap-2">{slots.map((s) => (
              <button key={s} onClick={() => setSel(s)} className={`rounded-xl py-3 text-sm font-medium ring-1 transition ${sel === s ? 'bg-[#7A8F7A] text-white ring-[#7A8F7A]' : 'bg-white ring-stone-300 hover:ring-[#7A8F7A]'}`}>{fmtTime(s)}</button>))}</div>}
      </div>

      {err && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{err}</p>}

      {sel && (
        <div className="mt-6 rounded-2xl bg-white/70 p-5 ring-1 ring-stone-200">
          <p className="text-xs uppercase tracking-wide text-stone-500">Récapitulatif</p>
          <p className="mt-1 text-lg font-medium capitalize">{fmtDate(sel)}</p>
          <p className="text-stone-600">{fmtTime(sel)} · durée 60 minutes</p>
          <button onClick={confirm} disabled={busy} className="mt-4 w-full rounded-xl bg-[#7A8F7A] px-4 py-3 font-medium text-white transition hover:bg-[#6B7F6B] disabled:opacity-60">{busy ? 'Confirmation…' : 'Confirmer la réservation'}</button>
        </div>
      )}
    </>
  );
}
