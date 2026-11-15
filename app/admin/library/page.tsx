'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { fmtDate } from '@/lib/format';

const KINDS: Record<string, string> = { pdf: 'Document (PDF, image, audio…)', exercice: 'Exercice', lien: 'Lien', conseil: 'Conseil', annonce: 'Annonce' };
type Client = { id: string; full_name: string | null; email: string };
type Res = { id: string; title: string; kind: string; body: string | null; url: string | null; file_path: string | null; audience: string; created_at: string; profiles: { full_name: string | null; email: string } | null };

export default function Library() {
  const [sb] = useState(() => createClient());
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Res[]>([]);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('pdf');
  const [audience, setAudience] = useState<'all' | 'client'>('all');
  const [clientId, setClientId] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    const [c, r] = await Promise.all([
      sb.from('profiles').select('id,full_name,email').eq('role', 'client').order('email'),
      sb.from('resources').select('id,title,kind,body,url,file_path,audience,created_at,profiles(full_name,email)').order('created_at', { ascending: false }),
    ]);
    setClients((c.data as Client[]) ?? []);
    setItems((r.data as unknown as Res[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (audience === 'client' && !clientId) { setMsg({ ok: false, text: 'Choisissez le client concerné.' }); return; }
    if (kind === 'lien' && !/^https?:\/\//i.test(url.trim())) { setMsg({ ok: false, text: 'Le lien doit commencer par https://' }); return; }
    if (kind === 'pdf' && !file) { setMsg({ ok: false, text: 'Ajoutez un fichier.' }); return; }
    if (file && file.size > 50 * 1024 * 1024) { setMsg({ ok: false, text: 'Fichier trop lourd (50 Mo maximum).' }); return; }
    setBusy(true);
    let path: string | null = null;
    if (file) {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';
      path = `${crypto.randomUUID()}.${ext}`;
      const up = await sb.storage.from('resources').upload(path, file, { contentType: file.type || undefined });
      if (up.error) { setBusy(false); setMsg({ ok: false, text: 'Envoi du fichier impossible (type non accepté ou fichier trop lourd).' }); return; }
    }
    const { error } = await sb.from('resources').insert({
      title: title.trim(), kind, audience, client_id: audience === 'client' ? clientId : null,
      body: body.trim() || null, url: kind === 'lien' ? url.trim() : null, file_path: path,
    });
    if (error) {
      if (path) await sb.storage.from('resources').remove([path]);
      setBusy(false); setMsg({ ok: false, text: 'Publication impossible. Vérifiez les champs.' }); return;
    }
    setBusy(false); setMsg({ ok: true, text: 'Publié.' });
    setTitle(''); setBody(''); setUrl(''); setFile(null); setFileKey((k) => k + 1);
    load();
  }

  async function remove(r: Res) {
    if (!window.confirm(`Supprimer « ${r.title} » ?`)) return;
    const { error } = await sb.from('resources').delete().eq('id', r.id);
    if (!error && r.file_path) await sb.storage.from('resources').remove([r.file_path]);
    load();
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Bibliothèque</h1>
      <p className="mt-1 text-sm text-stone-500">Ce que vous publiez ici apparaît dans l’espace de vos clients.</p>

      <form onSubmit={publish} className="card mt-6 grid gap-3 md:grid-cols-2">
        <input className="inp md:col-span-2" required maxLength={120} placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className="inp" value={kind} onChange={(e) => setKind(e.target.value)}>{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select className="inp" value={audience} onChange={(e) => setAudience(e.target.value as 'all' | 'client')}>
          <option value="all">Pour tous les clients</option><option value="client">Pour un client précis</option>
        </select>
        {audience === 'client' && (
          <select className="inp md:col-span-2" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Choisir le client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name ? `${c.full_name} · ` : ''}{c.email}</option>)}
          </select>
        )}
        {kind === 'lien' && <input className="inp md:col-span-2" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />}
        <textarea className="inp md:col-span-2" rows={4} maxLength={5000} placeholder={kind === 'conseil' || kind === 'annonce' ? 'Texte à afficher' : 'Description (facultatif)'} value={body} onChange={(e) => setBody(e.target.value)} />
        {kind !== 'lien' && kind !== 'conseil' && kind !== 'annonce' || kind === 'exercice' ? (
          <input key={fileKey} type="file" className="inp md:col-span-2" accept=".pdf,.png,.jpg,.jpeg,.webp,.mp3,.m4a,.mp4,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        ) : null}
        <button disabled={busy} className="btn md:col-span-2 disabled:opacity-60">{busy ? 'Publication…' : 'Publier'}</button>
      </form>
      {msg && <p className={`mt-3 rounded-xl p-3 text-sm ${msg.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <h2 className="mt-10 text-lg font-medium">Déjà publié</h2>
      {items.length === 0 ? <p className="mt-3 text-sm text-stone-500">Rien pour le moment.</p> : (
        <ul className="mt-3 divide-y divide-stone-200 rounded-2xl bg-white/70 ring-1 ring-stone-200">
          {items.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-stone-500">{KINDS[r.kind]?.split(' (')[0]} · {fmtDate(r.created_at)}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#E8EEE6] px-3 py-1 text-xs">{r.audience === 'all' ? 'Tous les clients' : (r.profiles?.full_name || r.profiles?.email || 'Client')}</span>
                <button onClick={() => remove(r)} className="text-xs text-red-700 underline">Supprimer</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
