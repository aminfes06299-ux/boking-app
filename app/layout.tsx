import './globals.css';
export const metadata = { title: 'Espace de réservation', robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body><main className="mx-auto w-full max-w-md px-5 py-10 has-[[data-wide]]:max-w-4xl">{children}</main></body></html>;
}
