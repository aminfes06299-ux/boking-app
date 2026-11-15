'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { useT } from '@/components/LangProvider';
import LangToggle from '@/components/LangToggle';

type Mode = 'login' | 'signup' | 'code';

export default function Login() {
  const router = useRouter();
  const { t } = useT();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verifyType, setVerifyType] = useState<'signup' | 'email' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const input = 'inp';
  const btn = 'btn w-full min-h-12 disabled:opacity-60';

  function switchMode(m: Mode) { setMode(m); setVerifyType(null); setError(''); setCode(''); }
  function done() { router.replace('/'); router.refresh(); }

  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { setError(/confirm/i.test(error.message) ? t('errUnconfirmed') : t('errLogin')); return; }
    done();
  }

  async function signup(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (password.length < 8) { setError(t('errPwdShort')); return; }
    setBusy(true);
    const sb = createClient();
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
    if (error) { setBusy(false); setError(t('errSignup')); return; }
    if (data.session) {
      // La confirmation d'e-mail doit être activée dans Supabase : on refuse d'ouvrir une session non vérifiée.
      await sb.auth.signOut(); setBusy(false); setError(t('errSignupOff')); return;
    }
    setBusy(false); setVerifyType('signup');
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const { error } = await createClient().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } });
    setBusy(false);
    if (error && error.status === 429) { setError(t('errWait')); return; }
    setVerifyType('email'); // message neutre : on ne révèle pas si le compte existe
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const { error } = await createClient().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: verifyType! });
    setBusy(false);
    if (error) { setError(t('errCode')); return; }
    done();
  }

  const tab = (m: Mode, label: string) => (
    <button type="button" onClick={() => switchMode(m)} className={`min-h-11 flex-1 rounded-lg px-3 text-sm ${mode === m ? 'bg-white font-semibold text-navy shadow-sm' : 'text-muted'}`}>{label}</button>
  );
  const bar = 'border-s-[3px] border-[#4FC3CC] ps-4';

  return (
    <div className="mx-auto mt-2 grid max-w-4xl overflow-hidden rounded-3xl border border-line bg-white shadow-sm md:mt-10 md:grid-cols-[1fr_1.1fr]">
      {/* Panneau de marque */}
      <div className="flex flex-col justify-between gap-10 bg-navy p-8 text-white md:p-12">
        <div dir="rtl">
          <div className="font-display text-4xl font-bold leading-tight md:text-5xl">أمين المرابط</div>
          <div className="mt-3 font-display text-lg leading-loose text-[#C4ECEF] md:text-xl">استشاري المرافقة النفسية والدعم السلوكي ومستشار العلاقات الزوجية والأسرية</div>
        </div>
        <div className="hidden flex-col gap-5 md:flex">
          <div className={bar}>{t('hero1')}</div>
          <div className={bar}>{t('hero2')}</div>
          <div className={bar}>{t('hero3')}</div>
        </div>
        <div className="hidden text-sm text-[#A9C4DA] md:block">{t('heroNote')}</div>
      </div>

      {/* Formulaire */}
      <div className="p-8 md:p-12">
        <div className="flex justify-end"><LangToggle /></div>
        <h1 className="mt-4 text-3xl font-semibold text-navy">{t('loginTitle')}</h1>
        <p className="mt-2 text-muted">{t('loginSub')}</p>

        {verifyType ? (
          <form onSubmit={verify} className="mt-6 space-y-3">
            <p className="text-sm text-muted">
              {verifyType === 'signup' ? t('signupSent', { email }) : t('codeSent', { email })} {t('checkSpam')}
            </p>
            <input inputMode="numeric" autoComplete="one-time-code" required maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('codePh')} className={input} />
            <button disabled={busy} className={btn}>{busy ? t('verifying') : t('validate')}</button>
            <button type="button" onClick={() => switchMode(mode)} className="w-full text-sm text-muted underline">{t('changeEmail')}</button>
          </form>
        ) : (
          <>
            {mode !== 'code' && <div className="mt-6 flex gap-1 rounded-xl bg-mint p-1">{tab('login', t('tabLogin'))}{tab('signup', t('tabSignup'))}</div>}

            {mode === 'login' && (
              <form onSubmit={login} className="mt-5 space-y-3">
                <input dir="ltr" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('email')} className={input} />
                <input dir="ltr" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('password')} className={input} />
                <button disabled={busy} className={btn}>{busy ? t('signingIn') : t('signIn')}</button>
                <button type="button" onClick={() => switchMode('code')} className="w-full text-sm text-teal underline">{t('forgot')}</button>
              </form>
            )}

            {mode === 'signup' && (
              <form onSubmit={signup} className="mt-5 space-y-3">
                <input dir="ltr" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('email')} className={input} />
                <input dir="ltr" type="password" required autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('pwdNew')} className={input} />
                <button disabled={busy} className={btn}>{busy ? t('creating') : t('createAcc')}</button>
                <p className="text-xs text-muted">{t('confirmMailInfo')}</p>
              </form>
            )}

            {mode === 'code' && (
              <form onSubmit={sendCode} className="mt-5 space-y-3">
                <p className="text-sm text-muted">{t('codeIntro')}</p>
                <input dir="ltr" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('email')} className={input} />
                <button disabled={busy} className={btn}>{busy ? t('sending') : t('getCode')}</button>
                <button type="button" onClick={() => switchMode('login')} className="w-full text-sm text-muted underline">{t('backLogin')}</button>
              </form>
            )}
          </>
        )}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      </div>
    </div>
  );
}
