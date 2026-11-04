'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) { setError('Impossible d’envoyer le code pour le moment. Réessayez dans quelques minutes.'); return; }
    setStep('code');
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    const { error } = await createClient().auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    setBusy(false);
    if (error) { setError('Code incorrect ou expiré.'); return; }
    router.replace('/');
    router.refresh();
  }

  const input = 'w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-[#7A8F7A]';
  const btn = 'w-full rounded-xl bg-[#7A8F7A] px-4 py-3 font-medium text-white transition hover:bg-[#6B7F6B] disabled:opacity-60';

  return (
    <div className="mt-16 rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-stone-200">
      <h1 className="text-2xl font-semibold">Votre espace de réservation</h1>
      {step === 'email' ? (
        <form onSubmit={sendCode} className="mt-6 space-y-3">
          <p className="text-sm text-stone-500">Entrez votre e-mail pour recevoir un code de connexion.</p>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre adresse e-mail" className={input} />
          <button disabled={busy} className={btn}>{busy ? 'Envoi…' : 'Recevoir mon code'}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-6 space-y-3">
          <p className="text-sm text-stone-500">Un code a été envoyé à <b>{email}</b>. Vérifiez aussi vos courriers indésirables.</p>
          <input inputMode="numeric" autoComplete="one-time-code" required maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code reçu par e-mail" className={input} />
          <button disabled={busy} className={btn}>{busy ? 'Vérification…' : 'Valider'}</button>
          <button type="button" onClick={() => { setStep('email'); setCode(''); setError(''); }} className="w-full text-sm text-stone-500 underline">Changer d’e-mail</button>
        </form>
      )}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
