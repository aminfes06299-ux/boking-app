import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { serverClient } from '@/lib/supabase-server';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

const KIND: Record<string, string> = { pdf: 'Document', exercice: 'Exercice', lien: 'Lien', conseil: 'Conseil', annonce: 'Annonce' };

export default async function Bibliotheque() {
  const sb = await serverClient();
  // La base ne renvoie que ce que CE client a le droit de voir (règles de sécurité RLS).
  const { data: items } = await sb.from('resources').select('id,title,kind,body,url,file_path,audience,created_at').order('created_at', { ascending: false });
  const list = items ?? [];

  // Liens temporaires (1 h) pour les fichiers, créés seulement pour les ressources déjà autorisées ci-dessus.
  const signed = new Map<string, string>();
  const paths = list.filter((i) => i.file_path).map((i) => i.file_path as string);
  if (paths.length) {
    const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { data } = await svc.storage.from('resources').createSignedUrls(paths, 3600);
    data?.forEach((d) => { if (d.path && d.signedUrl) signed.set(d.path, d.signedUrl); });
  }

  return (
    <>
      <Link href="/" className="text-sm text-stone-500 underline">← Retour</Link>
      <h1 className="mt-4 text-2xl font-semibold">Ma bibliothèque</h1>
      <p className="mt-1 text-sm text-stone-500">Les documents, exercices et conseils laissés pour vous.</p>

      {list.length === 0 ? <p className="mt-8 text-sm text-stone-500">Rien pour le moment. Les nouveautés apparaîtront ici.</p> : (
        <ul className="mt-6 space-y-3">
          {list.map((r) => {
            const href = r.file_path ? signed.get(r.file_path) : r.url;
            return (
              <li key={r.id} className="rounded-2xl bg-white/70 p-5 ring-1 ring-stone-200">
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-[#E8EEE6] px-3 py-1">{KIND[r.kind] ?? r.kind}</span>
                  {r.audience === 'all' && <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-600">Pour tous</span>}
                  <span className="ml-auto text-stone-400">{fmtDate(r.created_at)}</span>
                </div>
                <h2 className="mt-3 text-lg font-medium">{r.title}</h2>
                {r.body && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-600">{r.body}</p>}
                {href && <a href={href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-xl bg-[#7A8F7A] px-4 py-2 text-sm font-medium text-white hover:bg-[#6B7F6B]">{r.file_path ? 'Ouvrir le fichier' : 'Ouvrir le lien'}</a>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
