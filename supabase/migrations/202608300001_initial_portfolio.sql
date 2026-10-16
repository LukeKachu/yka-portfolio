begin;

create extension if not exists pgcrypto;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admin_users where user_id = auth.uid()) $$;

create table public.brands (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  logo_path text, website text, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.work_types (
  id uuid primary key default gen_random_uuid(), internal_name text not null, slug text not null unique,
  label_tr text not null, label_en text not null, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(), internal_name text not null, slug text not null unique,
  brand_id uuid references public.brands(id) on delete set null, project_date date,
  cover_path text, primary_media_path text, live_url text,
  title_tr text, title_en text, short_description_tr text, short_description_en text,
  description_tr text, description_en text, context_tr text, context_en text,
  seo_title_tr text, seo_title_en text, seo_description_tr text, seo_description_en text,
  translation_status_tr text not null default 'missing' check (translation_status_tr in ('missing','needs_review','approved')),
  translation_status_en text not null default 'missing' check (translation_status_en in ('missing','needs_review','approved')),
  featured boolean not null default false, published boolean not null default false, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.project_work_types (
  project_id uuid not null references public.projects(id) on delete cascade,
  work_type_id uuid not null references public.work_types(id) on delete cascade,
  primary key(project_id, work_type_id)
);

create table public.project_roles (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  role_tr text, role_en text, sort_order integer not null default 0
);

create table public.project_media (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('image','video','screenshot_desktop','screenshot_mobile')),
  storage_path text not null, alt_tr text, alt_en text, sort_order integer not null default 0
);

create table public.project_links (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  platform text not null check (platform in ('youtube','instagram','tiktok','website','other')),
  url text not null, label_tr text, label_en text, sort_order integer not null default 0
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(), company text not null, company_url text, employment_type text,
  location text, start_date date not null, end_date date, current_position boolean not null default false,
  job_title_tr text, job_title_en text, bullets_tr text[] not null default '{}', bullets_en text[] not null default '{}',
  translation_status_tr text not null default 'missing', translation_status_en text not null default 'missing',
  sort_order integer not null default 0, published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.education (
  id uuid primary key default gen_random_uuid(), institution text not null, program text not null,
  start_date date, end_date date, description_tr text, description_en text,
  sort_order integer not null default 0, published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.volunteering (
  id uuid primary key default gen_random_uuid(), organization text not null, role_tr text, role_en text,
  start_date date, end_date date, bullets_tr text[] not null default '{}', bullets_en text[] not null default '{}',
  sort_order integer not null default 0, published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.skill_groups (
  id uuid primary key default gen_random_uuid(), title_tr text not null, title_en text not null,
  sort_order integer not null default 0, published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.skill_groups(id) on delete cascade,
  name text not null, name_tr text, name_en text, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.about (
  id uuid primary key default gen_random_uuid(), content_tr text, content_en text, profile_image_path text,
  additional_info_tr text, additional_info_en text, published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.site_settings (
  id uuid primary key default gen_random_uuid(), singleton_key text not null unique default 'default' check (singleton_key = 'default'),
  full_name text, professional_title_tr text, professional_title_en text,
  hero_introduction_tr text, hero_introduction_en text, profile_photo_path text,
  email text, phone text, location text, linkedin_url text, social_links jsonb not null default '[]',
  resume_pdf_path text, seo_title_tr text, seo_title_en text, seo_description_tr text, seo_description_en text,
  social_image_path text, production_site_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['brands','work_types','projects','experiences','education','volunteering','skill_groups','skills','about','site_settings']
  loop execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name); end loop;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['admin_users','brands','work_types','projects','project_work_types','project_roles','project_media','project_links','experiences','education','volunteering','skill_groups','skills','about','site_settings']
  loop execute format('alter table public.%I enable row level security', table_name); end loop;
end $$;

create policy "admins read admin users" on public.admin_users for select to authenticated using (public.is_admin());

do $$ declare table_name text; begin
  foreach table_name in array array['brands','work_types','projects','project_work_types','project_roles','project_media','project_links','experiences','education','volunteering','skill_groups','skills','about','site_settings']
  loop
    execute format('create policy "admin all %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', table_name);
  end loop;
end $$;

create policy "public brands" on public.brands for select to anon, authenticated using (
  exists(select 1 from public.projects p where p.brand_id = brands.id and p.published)
);
create policy "public work types" on public.work_types for select to anon, authenticated using (
  exists(select 1 from public.project_work_types pwt join public.projects p on p.id = pwt.project_id where pwt.work_type_id = work_types.id and p.published)
);
create policy "public projects" on public.projects for select to anon, authenticated using (published);
create policy "public project work types" on public.project_work_types for select to anon, authenticated using (
  exists(select 1 from public.projects p where p.id = project_id and p.published)
);
create policy "public project roles" on public.project_roles for select to anon, authenticated using (
  exists(select 1 from public.projects p where p.id = project_id and p.published)
);
create policy "public project media" on public.project_media for select to anon, authenticated using (
  exists(select 1 from public.projects p where p.id = project_id and p.published)
);
create policy "public project links" on public.project_links for select to anon, authenticated using (
  exists(select 1 from public.projects p where p.id = project_id and p.published)
);
create policy "public experiences" on public.experiences for select to anon, authenticated using (published);
create policy "public education" on public.education for select to anon, authenticated using (published);
create policy "public volunteering" on public.volunteering for select to anon, authenticated using (published);
create policy "public skill groups" on public.skill_groups for select to anon, authenticated using (published);
create policy "public skills" on public.skills for select to anon, authenticated using (
  exists(select 1 from public.skill_groups g where g.id = group_id and g.published)
);
create policy "public about" on public.about for select to anon, authenticated using (published);
create policy "public settings" on public.site_settings for select to anon, authenticated using (true);

insert into storage.buckets(id, name, public) values
  ('portfolio-public', 'portfolio-public', true),
  ('resume-public', 'resume-public', true)
on conflict (id) do nothing;

create policy "public media read" on storage.objects for select to anon, authenticated
using (bucket_id in ('portfolio-public','resume-public'));
create policy "admin media insert" on storage.objects for insert to authenticated
with check (bucket_id in ('portfolio-public','resume-public') and public.is_admin());
create policy "admin media update" on storage.objects for update to authenticated
using (bucket_id in ('portfolio-public','resume-public') and public.is_admin())
with check (bucket_id in ('portfolio-public','resume-public') and public.is_admin());
create policy "admin media delete" on storage.objects for delete to authenticated
using (bucket_id in ('portfolio-public','resume-public') and public.is_admin());

commit;
