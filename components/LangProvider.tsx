'use client';
import { createContext, useContext } from 'react';
import { tr, type Key, type Lang } from '@/lib/i18n';
const Ctx = createContext<Lang>('fr');
export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) { return <Ctx.Provider value={lang}>{children}</Ctx.Provider>; }
export const useLang = () => useContext(Ctx);
export function useT() { const lang = useContext(Ctx); return { lang, t: (k: Key, v?: Record<string, string | number>) => tr(lang, k, v) }; }
