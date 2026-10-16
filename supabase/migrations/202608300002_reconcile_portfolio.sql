begin;

create extension if not exists pgcrypto;

create table if not exists public.admin_users (user_id uuid, created_at timestamptz default now());
create table if not exists public.brands (id uuid default gen_random_uuid(), name text, slug text, logo_path text, website text, sort_order integer default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.work_types (id uuid default gen_random_uuid(), internal_name text, slug text, label_tr text, label_en text, sort_order integer default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.projects (id uuid default gen_random_uuid(), internal_name text, slug text, brand_id uuid, project_date date, cover_path text, primary_media_path text, live_url text, title_tr text, title_en text, short_description_tr text, short_description_en text, description_tr text, description_en text, context_tr text, context_en text, seo_title_tr text, seo_title_en text, seo_description_tr text, seo_description_en text, translation_status_tr text default 'missing', translation_status_en text default 'missing', featured boolean default false, published boolean default false, sort_order integer default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.project_work_types (project_id uuid, work_type_id uuid);
create table if not exists public.project_roles (id uuid default gen_random_uuid(), project_id uuid, role_tr text, role_en text, sort_order integer default 0);
create table if not exists public.project_media (id uuid default gen_random_uuid(), project_id uuid, kind text, storage_path text, alt_tr text, alt_en text, sort_order integer default 0);
create table if not exists public.project_links (id uuid default gen_random_uuid(), project_id uuid, platform text, url text, label_tr text, label_en text, sort_order integer default 0);
create table if not exists public.experiences (id uuid default gen_random_uuid(), company text, company_url text, employment_type text, location text, start_date date, end_date date, current_position boolean default false, job_title_tr text, job_title_en text, bullets_tr text[] default '{}', bullets_en text[] default '{}', translation_status_tr text default 'missing', translation_status_en text default 'missing', sort_order integer default 0, published boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.education (id uuid default gen_random_uuid(), institution text, program text, start_date date, end_date date, description_tr text, description_en text, sort_order integer default 0, published boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.volunteering (id uuid default gen_random_uuid(), organization text, role_tr text, role_en text, start_date date, end_date date, bullets_tr text[] default '{}', bullets_en text[] default '{}', sort_order integer default 0, published boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.skill_groups (id uuid default gen_random_uuid(), title_tr text, title_en text, sort_order integer default 0, published boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.skills (id uuid default gen_random_uuid(), group_id uuid, name text, name_tr text, name_en text, sort_order integer default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.about (id uuid default gen_random_uuid(), content_tr text, content_en text, profile_image_path text, additional_info_tr text, additional_info_en text, published boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.site_settings (id uuid default gen_random_uuid(), singleton_key text default 'default', full_name text, professional_title_tr text, professional_title_en text, hero_introduction_tr text, hero_introduction_en text, profile_photo_path text, email text, phone text, location text, linkedin_url text, social_links jsonb default '[]'::jsonb, resume_pdf_path text, seo_title_tr text, seo_title_en text, seo_description_tr text, seo_description_en text, social_image_path text, production_site_url text, created_at timestamptz default now(), updated_at timestamptz default now());

alter table public.admin_users add column if not exists user_id uuid;
alter table public.admin_users add column if not exists created_at timestamptz default now();
alter table public.brands add column if not exists id uuid default gen_random_uuid(), add column if not exists name text, add column if not exists slug text, add column if not exists logo_path text, add column if not exists website text, add column if not exists sort_order integer default 0, add column if not exists created_at timestamptz default now(), add column if not exists updated_at timestamptz default now();
alter table public.work_types add column if not exists id uuid default gen_random_uuid(), add column if not exists internal_name text, add column if not exists slug text, add column if not exists label_tr text, add column if not exists label_en text, add column if not exists sort_order integer default 0, add column if not exists created_at timestamptz default now(), add column if not exists updated_at timestamptz default now();
alter table public.projects add column if not exists id uuid default gen_random_uuid(), add column if not exists internal_name text, add column if not exists slug text, add column if not exists brand_id uuid, add column if not exists project_date date, add column if not exists cover_path text, add column if not exists primary_media_path text, add column if not exists live_url text, add column if not exists title_tr text, add column if not exists title_en text, add column if not exists short_description_tr text, add column if not exists short_description_en text, add column if not exists description_tr text, add column if not exists description_en text, add column if not exists context_tr text, add column if not exists context_en text, add column if not exists seo_title_tr text, add column if not exists seo_title_en text, add column if not exists seo_description_tr text, add column if not exists seo_description_en text, add column if not exists translation_status_tr text default 'missing', add column if not exists translation_status_en text default 'missing', add column if not exists featured boolean default false, add column if not exists published boolean default false, add column if not exists sort_order integer default 0, add column if not exists created_at timestamptz default now(), add column if not exists updated_at timestamptz default now();
alter table public.project_work_types add column if not exists project_id uuid, add column if not exists work_type_id uuid;
alter table public.project_roles add column if not exists id uuid default gen_random_uuid(), add column if not exists project_id uuid, add column if not exists role_tr text, add column if not exists role_en text, add column if not exists sort_order integer default 0;
alter table public.project_media add column if not exists id uuid default gen_random_uuid(), add column if not exists project_id uuid, add column if not exists kind text, add column if not exists storage_path text, add column if not exists alt_tr text, add column if not exists alt_en text, add column if not exists sort_order integer default 0;
alter table public.project_links add column if not exists id uuid default gen_random_uuid(), add column if not exists project_id uuid, add column if not exists platform text, add column if not exists url text, add column if not exists label_tr text, add column if not exists label_en text, add column if not exists sort_order integer default 0;
alter table public.experiences add column if not exists id uuid default gen_random_uuid(), add column if not exists company text, add column if not exists company_url text, add column if not exists employment_type text, add column if not exists location text, add column if not exists start_date date, add column if not exists end_date date, add column if not exists current_position boolean default false, add column if not exists job_title_tr text, add column if not exists job_title_en text, add column if not exists bullets_tr text[] default '{}', add column if not exists bullets_en text[] default '{}', add column if not exists translation_status_tr text default 'missing', add column if not exists translation_status_en text default 'missing', add column if not exists sort_order integer default 0, add column if not exists published boolean default false, add column if not exists created_at timestamptz default now(), add column if not exists updated_at timestamptz default now();
alter table public.education add column if not exists id uuid default gen_random_uuid(), add column if not exists institution text, add column if not exists program text, add column if not exists start_date date, add column if not exists end_date date, add column if not exists description_tr text, add column if not exists description_en text, add column if not exists sort_order integer default 0, add column if not exists published boolean default false, add column if not exists created_at timestamptz default now(), add column if not exists updated_at timestamptz default now();
alter table public.volunteering add column if not exists id uuid default gen_random_uuid(), add column if not exists organization text, add column if not exists role_tr text, add column if not exists role_en text, add column if not exists start_date date, add column if not exists end_date date, add column if not exists bullets_tr text[] default '{}', add column if not exists bullets_en text[] default '{}', add column if not exists sort_order integer default 0, add column if not exists published boolean default false, add column if not exists created_at timestamptz default now(), add column if not exists updated_at timestamptz default now();
alter table public.skill_groups add column if not exists id uuid default gen_random_uuid(), add column if not exists title_tr text, add column if not exists title_en text, add column if not exists sort_order integer default 0, add column if not exists published boolean default false, add column if not exists created_at timestamptz default now(), add column if not exists updated_at timestamptz default now();
alter table public.skills add column if not exists id uuid default gen_random_uuid(), add column if not exists group_id uuid, add column if not exists name text, add column if not exists name_tr text, add column if not exists name_en text, add column if not exists sort_order integer default 0, add column if not exists created_at timestamptz default now(), add column if not exists updated_at timestamptz default now();
alter table public.about add column if not exists id uuid default gen_random_uuid(), add column if not exists content_tr text, add column if not exists content_en text, add column if not exists profile_image_path text, add column if not exists additional_info_tr text, add column if not exists additional_info_en text, add column if not exists published boolean default false, add column if not exists created_at timestamptz default now(), add column if not exists updated_at timestamptz default now();
alter table public.site_settings add column if not exists id uuid default gen_random_uuid(), add column if not exists singleton_key text default 'default', add column if not exists full_name text, add column if not exists professional_title_tr text, add column if not exists professional_title_en text, add column if not exists hero_introduction_tr text, add column if not exists hero_introduction_en text, add column if not exists profile_photo_path text, add column if not exists email text, add column if not exists phone text, add column if not exists location text, add column if not exists linkedin_url text, add column if not exists social_links jsonb default '[]'::jsonb, add column if not exists resume_pdf_path text, add column if not exists seo_title_tr text, add column if not exists seo_title_en text, add column if not exists seo_description_tr text, add column if not exists seo_description_en text, add column if not exists social_image_path text, add column if not exists production_site_url text, add column if not exists created_at timestamptz default now(), add column if not exists updated_at timestamptz default now();

do $$
declare item record;
begin
  for item in select * from (values
    ('admin_users','admin_users_pkey','primary key (user_id)'), ('brands','brands_pkey','primary key (id)'),
    ('work_types','work_types_pkey','primary key (id)'), ('projects','projects_pkey','primary key (id)'),
    ('project_work_types','project_work_types_pkey','primary key (project_id, work_type_id)'),
    ('project_roles','project_roles_pkey','primary key (id)'), ('project_media','project_media_pkey','primary key (id)'),
    ('project_links','project_links_pkey','primary key (id)'), ('experiences','experiences_pkey','primary key (id)'),
    ('education','education_pkey','primary key (id)'), ('volunteering','volunteering_pkey','primary key (id)'),
    ('skill_groups','skill_groups_pkey','primary key (id)'), ('skills','skills_pkey','primary key (id)'),
    ('about','about_pkey','primary key (id)'), ('site_settings','site_settings_pkey','primary key (id)')
  ) as v(table_name,constraint_name,definition)
  loop
    if not exists(select 1 from pg_constraint where conrelid=format('public.%I',item.table_name)::regclass and contype='p') then
      begin execute format('alter table public.%I add constraint %I %s',item.table_name,item.constraint_name,item.definition);
      exception when others then raise warning 'Could not add constraint %: %',item.constraint_name,sqlerrm; end;
    end if;
  end loop;
end $$;

do $$
declare item record;
begin
  for item in select * from (values
    ('admin_users','admin_users_user_id_fkey','foreign key (user_id) references auth.users(id) on delete cascade'),
    ('projects','projects_brand_id_fkey','foreign key (brand_id) references public.brands(id) on delete set null'),
    ('project_work_types','project_work_types_project_id_fkey','foreign key (project_id) references public.projects(id) on delete cascade'),
    ('project_work_types','project_work_types_work_type_id_fkey','foreign key (work_type_id) references public.work_types(id) on delete cascade'),
    ('project_roles','project_roles_project_id_fkey','foreign key (project_id) references public.projects(id) on delete cascade'),
    ('project_media','project_media_project_id_fkey','foreign key (project_id) references public.projects(id) on delete cascade'),
    ('project_links','project_links_project_id_fkey','foreign key (project_id) references public.projects(id) on delete cascade'),
    ('skills','skills_group_id_fkey','foreign key (group_id) references public.skill_groups(id) on delete cascade')
  ) as v(table_name,constraint_name,definition)
  loop
    if not exists(select 1 from pg_constraint where conrelid=format('public.%I',item.table_name)::regclass and conname=item.constraint_name) then
      begin execute format('alter table public.%I add constraint %I %s not valid',item.table_name,item.constraint_name,item.definition);
      exception when others then raise warning 'Could not add constraint %: %',item.constraint_name,sqlerrm; end;
    end if;
  end loop;
end $$;

do $$ begin
  begin create unique index if not exists brands_slug_key on public.brands(slug) where slug is not null; exception when unique_violation then raise warning 'brands.slug contains duplicates'; end;
  begin create unique index if not exists work_types_slug_key on public.work_types(slug) where slug is not null; exception when unique_violation then raise warning 'work_types.slug contains duplicates'; end;
  begin create unique index if not exists projects_slug_key on public.projects(slug) where slug is not null; exception when unique_violation then raise warning 'projects.slug contains duplicates'; end;
  begin create unique index if not exists site_settings_singleton_key_key on public.site_settings(singleton_key) where singleton_key is not null; exception when unique_violation then raise warning 'site_settings.singleton_key contains duplicates'; end;
  create index if not exists projects_brand_id_idx on public.projects(brand_id);
  create index if not exists projects_public_order_idx on public.projects(published,sort_order);
  create index if not exists project_roles_project_id_idx on public.project_roles(project_id);
  create index if not exists project_media_project_id_idx on public.project_media(project_id);
  create index if not exists project_links_project_id_idx on public.project_links(project_id);
  create index if not exists experiences_public_order_idx on public.experiences(published,sort_order);
  create index if not exists skills_group_id_idx on public.skills(group_id);
end $$;

do $$ begin
  if to_regprocedure('public.is_admin()') is null then
    execute 'create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $fn$ select exists(select 1 from public.admin_users where user_id=auth.uid()) $fn$';
  end if;
  if to_regprocedure('public.set_updated_at()') is null then
    execute 'create function public.set_updated_at() returns trigger language plpgsql as $fn$ begin new.updated_at=now(); return new; end $fn$';
  end if;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['admin_users','brands','work_types','projects','project_work_types','project_roles','project_media','project_links','experiences','education','volunteering','skill_groups','skills','about','site_settings']
  loop execute format('alter table public.%I enable row level security',table_name); end loop;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['brands','work_types','projects','experiences','education','volunteering','skill_groups','skills','about','site_settings'] loop
    if not exists(select 1 from pg_trigger where tgrelid=format('public.%I',table_name)::regclass and tgname=format('set_%s_updated_at',table_name) and not tgisinternal) then
      execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()',format('set_%s_updated_at',table_name),table_name);
    end if;
  end loop;
end $$;

do $$
declare item record;
begin
  for item in select * from (values
    ('admin_users','admins read admin users','for select to authenticated using (public.is_admin())'),
    ('brands','admin all brands','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('work_types','admin all work_types','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('projects','admin all projects','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('project_work_types','admin all project_work_types','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('project_roles','admin all project_roles','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('project_media','admin all project_media','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('project_links','admin all project_links','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('experiences','admin all experiences','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('education','admin all education','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('volunteering','admin all volunteering','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('skill_groups','admin all skill_groups','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('skills','admin all skills','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('about','admin all about','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('site_settings','admin all site_settings','for all to authenticated using (public.is_admin()) with check (public.is_admin())'),
    ('projects','public projects','for select to anon,authenticated using (published is true)'),
    ('experiences','public experiences','for select to anon,authenticated using (published is true)'),
    ('education','public education','for select to anon,authenticated using (published is true)'),
    ('volunteering','public volunteering','for select to anon,authenticated using (published is true)'),
    ('skill_groups','public skill groups','for select to anon,authenticated using (published is true)'),
    ('about','public about','for select to anon,authenticated using (published is true)'),
    ('site_settings','public settings','for select to anon,authenticated using (true)'),
    ('brands','public brands','for select to anon,authenticated using (exists(select 1 from public.projects p where p.brand_id=brands.id and p.published is true))'),
    ('work_types','public work types','for select to anon,authenticated using (exists(select 1 from public.project_work_types pwt join public.projects p on p.id=pwt.project_id where pwt.work_type_id=work_types.id and p.published is true))'),
    ('project_work_types','public project work types','for select to anon,authenticated using (exists(select 1 from public.projects p where p.id=project_id and p.published is true))'),
    ('project_roles','public project roles','for select to anon,authenticated using (exists(select 1 from public.projects p where p.id=project_id and p.published is true))'),
    ('project_media','public project media','for select to anon,authenticated using (exists(select 1 from public.projects p where p.id=project_id and p.published is true))'),
    ('project_links','public project links','for select to anon,authenticated using (exists(select 1 from public.projects p where p.id=project_id and p.published is true))'),
    ('skills','public skills','for select to anon,authenticated using (exists(select 1 from public.skill_groups g where g.id=group_id and g.published is true))')
  ) as v(table_name,policy_name,definition)
  loop
    if not exists(select 1 from pg_policies where schemaname='public' and tablename=item.table_name and policyname=item.policy_name) then
      execute format('create policy %I on public.%I %s',item.policy_name,item.table_name,item.definition);
    end if;
  end loop;
end $$;

insert into storage.buckets(id,name,public)
select v.id,v.name,v.public from (values ('portfolio-public','portfolio-public',true),('resume-public','resume-public',true)) as v(id,name,public)
where not exists(select 1 from storage.buckets b where b.id=v.id);

do $$
declare item record;
begin
  for item in select * from (values
    ('public media read','for select to anon,authenticated using (bucket_id in (''portfolio-public'',''resume-public''))'),
    ('admin media insert','for insert to authenticated with check (bucket_id in (''portfolio-public'',''resume-public'') and public.is_admin())'),
    ('admin media update','for update to authenticated using (bucket_id in (''portfolio-public'',''resume-public'') and public.is_admin()) with check (bucket_id in (''portfolio-public'',''resume-public'') and public.is_admin())'),
    ('admin media delete','for delete to authenticated using (bucket_id in (''portfolio-public'',''resume-public'') and public.is_admin())')
  ) as v(policy_name,definition)
  loop
    if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname=item.policy_name) then
      execute format('create policy %I on storage.objects %s',item.policy_name,item.definition);
    end if;
  end loop;
end $$;

commit;
