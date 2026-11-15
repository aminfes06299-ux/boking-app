'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { useT } from '@/components/LangProvider';

export default function Compte() {
  const { t } = useT();
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (pwd.length < 8) { setMsg({ ok: false, text: t('errPwdShort') }); return; }
    if (pwd !== pwd2) { setMsg({ ok: false, text: t('pwdMismatch') }); return; }
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: t('pwdFail') }); return; }
    setPwd(''); setPwd2(''); setMsg({ ok: true, text: t('pwdSaved') });
  }

  return (
    <div className="mx-auto max-w-md">
      <Link href="/" className="text-sm text-muted underline">{t('back')}</Link>
      <h1 className="mt-4 text-3xl font-semibold text-navy">{t('myPwd')}</h1>
      <form onSubmit={save} className="mt-6 space-y-3">
        <input dir="ltr" type="password" required autoComplete="new-password" minLength={8} value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder={t('newPwd')} className="inp" />
        <input dir="ltr" type="password" required autoComplete="new-password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} placeholder={t('confPwd')} className="inp" />
        <button disabled={busy} className="btn w-full min-h-12 disabled:opacity-60">{busy ? t('saving') : t('save')}</button>
      </form>
      {msg && <p role="status" className={`mt-4 rounded-xl p-3 text-sm ${msg.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{msg.text}</p>}
    </div>
  );
}
