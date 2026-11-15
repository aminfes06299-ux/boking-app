-- Bibliothèque : ressources (PDF, exercices, liens, conseils, annonces) pour tous les clients ou pour un client précis.
create table resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  kind text not null check (kind in ('pdf','exercice','lien','conseil','annonce')),
  body text check (body is null or char_length(body) <= 5000),
  url text check (url is null or url ~* '^https?://'),
  file_path text,
  audience text not null default 'all' check (audience in ('all','client')),
  client_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (audience = 'all' or client_id is not null)
);
create index resources_client_idx on resources(client_id);
alter table resources enable row level security;
create policy resources_admin on resources for all using (is_admin()) with check (is_admin());
create policy resources_self on resources for select using (
  (audience = 'all' or client_id = auth.uid())
  and exists (select 1 from profiles p where p.id = auth.uid() and p.active)
);

-- Dossier de fichiers PRIVÉ : seul l'admin y accède directement ; les clients passent par des liens signés temporaires créés côté serveur.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resources', 'resources', false, 52428800, array[
  'application/pdf','image/png','image/jpeg','image/webp','audio/mpeg','audio/mp4','audio/x-m4a','video/mp4',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;
create policy resources_files_admin on storage.objects for all
  using (bucket_id = 'resources' and is_admin()) with check (bucket_id = 'resources' and is_admin());
