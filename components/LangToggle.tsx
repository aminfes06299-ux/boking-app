'use client';
import { useRouter } from 'next/navigation';
import { useLang } from './LangProvider';

export default function LangToggle({ light = false }: { light?: boolean }) {
  const lang = useLang();
  const router = useRouter();
  function set(l: 'fr' | 'ar') {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }
  const base = 'px-2 py-1 text-sm rounded-md transition';
  const on = light ? 'bg-white text-navy font-semibold' : 'bg-navy text-white font-semibold';
  const off = light ? 'text-white/80 hover:text-white' : 'text-muted hover:text-navy';
  return (
    <div dir="ltr" className="inline-flex items-center gap-1" role="group" aria-label="Langue / اللغة">
      <button type="button" onClick={() => set('fr')} aria-pressed={lang === 'fr'} className={`${base} ${lang === 'fr' ? on : off}`}>FR</button>
      <button type="button" onClick={() => set('ar')} aria-pressed={lang === 'ar'} className={`${base} ${lang === 'ar' ? on : off}`}>عربي</button>
    </div>
  );
}
