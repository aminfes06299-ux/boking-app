'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function CancelButton({ id }: { id: string }) {
  const [ask, setAsk] = useState(false); const [err, setErr] = useState(''); const router = useRouter();
  async function go() {
    const r = await fetch('/api/cancel', { method: 'POST', body: JSON.stringify({ id }) });
    if (r.ok) router.refresh(); else { setErr((await r.json()).error); setAsk(false); }
  }
  return (
    <div className="mt-3 text-sm">
      {ask ? (
        <span>Confirmer l'annulation ? <button onClick={go} className="font-medium text-red-700 underline">Oui</button> · <button onClick={() => setAsk(false)} className="underline">Non</button></span>
      ) : <button onClick={() => setAsk(true)} className="text-stone-500 underline">Annuler ce rendez-vous</button>}
      {err && <p className="mt-1 text-red-700">{err}</p>}
    </div>
  );
}
