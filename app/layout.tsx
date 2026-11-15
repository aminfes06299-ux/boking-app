import './globals.css';
import Link from 'next/link';
export const metadata = { title: 'Espace de réservation', robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <main className="mx-auto w-full max-w-md px-5 py-10 has-[[data-wide]]:max-w-4xl">{children}</main>
        <footer className="pb-10 text-center text-xs text-stone-400">
          <Link href="/confidentialite" className="underline">Confidentialité · الخصوصية</Link>
          <span className="mx-2">·</span>
          <Link href="/conditions" className="underline">Conditions · الشروط</Link>
        </footer>
      </body>
    </html>
  );
}
