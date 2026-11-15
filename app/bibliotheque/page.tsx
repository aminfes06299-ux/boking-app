import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { serverClient } from '@/lib/supabase-server';
import { fmtDate } from '@/lib/format';
import { tr, type Key } from '@/lib/i18n';
import { getLang } from '@/lib/lang-server';

export const dynamic = 'force-dynamic';

const KIND: Record<string, Key> = { pdf: 'kDoc', exercice: 'kEx', lien: 'kLink', conseil: 'kTip', annonce: 'kNews' };

export default async function Bibliotheque() {
  const lang = await getLang();
  const t = (k: Key) => tr(lang, k);
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
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="text-sm text-muted underline">{t('back')}</Link>
      <h1 className="mt-4 text-3xl font-semibold text-navy">{t('library')}</h1>
      <p className="mt-1 text-muted">{t('libSub')}</p>

      {list.length === 0 ? <p className="mt-8 text-sm text-muted">{t('libEmpty')}</p> : (
        <ul className="mt-6 space-y-3">
          {list.map((r) => {
            const href = r.file_path ? signed.get(r.file_path) : r.url;
            return (
              <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-mint px-3 py-1 font-semibold text-teal-dark">{KIND[r.kind] ? t(KIND[r.kind]) : r.kind}</span>
                  {r.audience === 'all' && <span className="rounded-full bg-[#EEF0F7] px-3 py-1 font-semibold text-[#2D3D78]">{t('forAll')}</span>}
                  <span className="ms-auto text-muted">{fmtDate(r.created_at, lang)}</span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-navy">{r.title}</h2>
                {r.body && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{r.body}</p>}
                {href && <a href={href} target="_blank" rel="noopener noreferrer" className="btn mt-4 inline-block text-sm">{r.file_path ? t('openFile') : t('openLink')}</a>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
