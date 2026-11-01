import Link from 'next/link';
import { redirect } from 'next/navigation';
import { serverClient } from '@/lib/supabase-server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data } = await (await serverClient()).rpc('is_admin');
  if (!data) redirect('/');
  return (
    <div data-wide>
      <nav className="mb-8 flex flex-wrap gap-4 text-sm">
        <Link href="/admin" className="font-medium">Rendez-vous</Link>
        <Link href="/admin/clients">Clients</Link>
        <Link href="/admin/availability">Disponibilités</Link>
        <Link href="/admin/settings">Paramètres</Link>
        <Link href="/" className="ml-auto text-stone-500">← Espace client</Link>
      </nav>
      {children}
    </div>
  );
}
