import './globals.css';
import Link from 'next/link';
import { getLang } from '@/lib/lang-server';
import { tr } from '@/lib/i18n';
import { LangProvider } from '@/components/LangProvider';
import SiteHeader from '@/components/SiteHeader';

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: { default: 'Coach El Morabit · Espace de réservation', template: '%s · Coach El Morabit' },
  description: 'Réservez vos séances et retrouvez vos ressources dans votre espace personnel.',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'Coach El Morabit', statusBarStyle: 'default' },
};
export const viewport: Viewport = { themeColor: '#12355B', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600&family=Noto+Sans+Arabic:wght@400;500;600&display=swap" />
      </head>
      <body>
        <LangProvider lang={lang}>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-5 py-8">{children}</main>
          <footer className="pb-10 text-center text-xs text-muted">
            <Link href="/confidentialite" className="underline">{tr(lang, 'privacy')}</Link>
            <span className="mx-2">·</span>
            <Link href="/conditions" className="underline">{tr(lang, 'terms')}</Link>
          </footer>
        </LangProvider>
      </body>
    </html>
  );
}
