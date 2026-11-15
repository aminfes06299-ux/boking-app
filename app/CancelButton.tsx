'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/components/LangProvider';

export default function CancelButton({ id, light = false }: { id: string; light?: boolean }) {
  const { t } = useT();
  const [ask, setAsk] = useState(false); const [err, setErr] = useState(''); const router = useRouter();
  async function go() {
    const r = await fetch('/api/cancel', { method: 'POST', body: JSON.stringify({ id }) });
    if (r.ok) router.refresh(); else { setErr((await r.json()).error); setAsk(false); }
  }
  const link = light ? 'text-white/85 underline' : 'text-muted underline';
  return (
    <div className="mt-5 text-sm">
      {ask ? (
        <span>{t('confirmCancel')} <button onClick={go} className="font-semibold underline">{t('yes')}</button> · <button onClick={() => setAsk(false)} className="underline">{t('no')}</button></span>
      ) : <button onClick={() => setAsk(true)} className={link}>{t('cancelThis')}</button>}
      {err && <p className="mt-1 text-red-300">{err}</p>}
    </div>
  );
}
