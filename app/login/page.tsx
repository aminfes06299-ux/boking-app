'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function Login() {
  const [email, setEmail] = useState(''); const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const router = useRouter();

  async function sendCode(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await createClient().auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${location.origin}/auth/callback` } });
    setBusy(false);
    if (error && (error.status === 429 || !error.status)) {
      setErr(error.status === 429 ? 'Trop de demandes. Merci de patienter quelques minutes avant de réessayer.' : 'Problème de connexion au service. Merci de réessayer.');
      return;
    }
    setStep('code'); // même réponse pour une adresse inconnue : aucune fuite d'information
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await createClient().auth.verifyOtp({ email, token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) { setErr('Code invalide ou expiré. Vous pouvez demander un nouveau code.'); return; }
    router.replace('/'); router.refresh();
  }

  return (
    <div className="mt-16 rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-stone-200">
      <h1 className="text-2xl font-semibold">Votre espace de réservation</h1>
      <p className="mt-2 text-sm text-stone-500">Accès réservé aux personnes accompagnées.</p>
      {step === 'email' ? (
        <form onSubmit={sendCode} className="mt-6 space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre adresse e-mail" className="inp" />
          <button disabled={busy} className="btn w-full disabled:opacity-60">{busy ? 'Envoi…' : 'Recevoir mon code de connexion'}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-6 space-y-3">
          <p className="rounded-xl bg-[#E8EEE6] p-4 text-sm">Si votre adresse est autorisée, un code vient de vous être envoyé. Pensez à vérifier vos courriers indésirables.</p>
          <input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code reçu par e-mail" className="inp text-center tracking-widest" />
          <button disabled={busy} className="btn w-full disabled:opacity-60">{busy ? 'Vérification…' : 'Me connecter'}</button>
          <button type="button" onClick={() => { setStep('email'); setCode(''); setErr(''); }} className="w-full text-sm text-stone-500 underline">Changer d'adresse / redemander un code</button>
        </form>
      )}
      {err && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{err}</p>}
    </div>
  );
}
