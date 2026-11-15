'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

type Mode = 'login' | 'signup' | 'code';

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verifyType, setVerifyType] = useState<'signup' | 'email' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const input = 'w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-[#7A8F7A]';
  const btn = 'w-full rounded-xl bg-[#7A8F7A] px-4 py-3 font-medium text-white transition hover:bg-[#6B7F6B] disabled:opacity-60';

  function switchMode(m: Mode) { setMode(m); setVerifyType(null); setError(''); setCode(''); }
  function done() { router.replace('/'); router.refresh(); }

  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { setError(/confirm/i.test(error.message) ? 'Votre e-mail n’est pas encore confirmé. Utilisez « Recevoir un code » ci-dessous.' : 'E-mail ou mot de passe incorrect.'); return; }
    done();
  }

  async function signup(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setBusy(true);
    const sb = createClient();
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
    if (error) { setBusy(false); setError('Impossible de créer le compte pour le moment. Réessayez dans quelques minutes.'); return; }
    if (data.session) {
      // La confirmation d'e-mail doit être activée dans Supabase : on refuse d'ouvrir une session non vérifiée.
      await sb.auth.signOut(); setBusy(false);
      setError('Inscription momentanément indisponible. Merci de me contacter.'); return;
    }
    setBusy(false); setVerifyType('signup');
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const { error } = await createClient().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } });
    setBusy(false);
    if (error && error.status === 429) { setError('Merci de patienter une minute avant de redemander un code.'); return; }
    setVerifyType('email'); // message neutre : on ne révèle pas si le compte existe
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const { error } = await createClient().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: verifyType! });
    setBusy(false);
    if (error) { setError('Code incorrect ou expiré.'); return; }
    done();
  }

  const tab = (m: Mode, label: string) => (
    <button type="button" onClick={() => switchMode(m)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === m ? 'bg-white shadow-sm' : 'text-stone-500'}`}>{label}</button>
  );

  return (
    <div className="mt-16 rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-stone-200">
      <h1 className="text-2xl font-semibold">Votre espace personnel</h1>

      {verifyType ? (
        <form onSubmit={verify} className="mt-6 space-y-3">
          <p className="text-sm text-stone-500">
            {verifyType === 'signup' ? <>Un code de confirmation a été envoyé à <b>{email}</b>.</> : <>Si un compte existe pour <b>{email}</b>, un code vient d’être envoyé.</>} Vérifiez aussi vos courriers indésirables.
          </p>
          <input inputMode="numeric" autoComplete="one-time-code" required maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code reçu par e-mail" className={input} />
          <button disabled={busy} className={btn}>{busy ? 'Vérification…' : 'Valider'}</button>
          <button type="button" onClick={() => switchMode(mode)} className="w-full text-sm text-stone-500 underline">Changer d’e-mail</button>
        </form>
      ) : (
        <>
          {mode !== 'code' && <div className="mt-5 flex gap-1 rounded-xl bg-[#E8EEE6] p-1">{tab('login', 'Connexion')}{tab('signup', 'Créer un compte')}</div>}

          {mode === 'login' && (
            <form onSubmit={login} className="mt-5 space-y-3">
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Adresse e-mail" className={input} />
              <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className={input} />
              <button disabled={busy} className={btn}>{busy ? 'Connexion…' : 'Se connecter'}</button>
              <button type="button" onClick={() => switchMode('code')} className="w-full text-sm text-stone-500 underline">Mot de passe oublié ? Recevoir un code par e-mail</button>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={signup} className="mt-5 space-y-3">
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Adresse e-mail" className={input} />
              <input type="password" required autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choisissez un mot de passe (8 caractères min.)" className={input} />
              <button disabled={busy} className={btn}>{busy ? 'Création…' : 'Créer mon compte'}</button>
              <p className="text-xs text-stone-500">Un code de confirmation vous sera envoyé par e-mail.</p>
            </form>
          )}

          {mode === 'code' && (
            <form onSubmit={sendCode} className="mt-5 space-y-3">
              <p className="text-sm text-stone-500">Entrez votre e-mail pour recevoir un code de connexion. Une fois connecté, vous pourrez choisir un nouveau mot de passe.</p>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Adresse e-mail" className={input} />
              <button disabled={busy} className={btn}>{busy ? 'Envoi…' : 'Recevoir mon code'}</button>
              <button type="button" onClick={() => switchMode('login')} className="w-full text-sm text-stone-500 underline">Retour à la connexion</button>
            </form>
          )}
        </>
      )}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
