'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

export default function Compte() {
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (pwd.length < 8) { setMsg({ ok: false, text: 'Le mot de passe doit contenir au moins 8 caractères.' }); return; }
    if (pwd !== pwd2) { setMsg({ ok: false, text: 'Les deux mots de passe ne sont pas identiques.' }); return; }
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: 'Impossible de modifier le mot de passe pour le moment.' }); return; }
    setPwd(''); setPwd2(''); setMsg({ ok: true, text: 'Mot de passe enregistré. Vous pourrez désormais vous connecter avec.' });
  }

  const input = 'w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-[#7A8F7A]';
  return (
    <>
      <Link href="/" className="text-sm text-stone-500 underline">← Retour</Link>
      <h1 className="mt-4 text-2xl font-semibold">Mon mot de passe</h1>
      <form onSubmit={save} className="mt-6 space-y-3">
        <input type="password" required autoComplete="new-password" minLength={8} value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Nouveau mot de passe (8 caractères min.)" className={input} />
        <input type="password" required autoComplete="new-password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} placeholder="Confirmer le mot de passe" className={input} />
        <button disabled={busy} className="w-full rounded-xl bg-[#7A8F7A] px-4 py-3 font-medium text-white transition hover:bg-[#6B7F6B] disabled:opacity-60">{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      </form>
      {msg && <p className={`mt-4 rounded-xl p-3 text-sm ${msg.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
    </>
  );
}
