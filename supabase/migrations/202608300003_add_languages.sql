begin;

alter table public.education
  add column if not exists program_tr text,
  add column if not exists program_en text;

create table if not exists public.languages (
  id uuid default gen_random_uuid(),
  name_tr text,
  name_en text,
  proficiency_tr text,
  proficiency_en text,
  sort_order integer default 0,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.languages
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists name_tr text,
  add column if not exists name_en text,
  add column if not exists proficiency_tr text,
  add column if not exists proficiency_en text,
  add column if not exists sort_order integer default 0,
  add column if not exists published boolean default false,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.languages'::regclass and contype = 'p'
  ) then
    alter table public.languages add constraint languages_pkey primary key (id);
  end if;
end $$;

create index if not exists languages_public_order_idx
  on public.languages(published, sort_order);

alter table public.languages enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'languages' and policyname = 'admin all languages'
  ) then
    create policy "admin all languages" on public.languages
      for all to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'languages' and policyname = 'public languages'
  ) then
    create policy "public languages" on public.languages
      for select to anon, authenticated
      using (published is true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.languages'::regclass
      and tgname = 'set_languages_updated_at'
      and not tgisinternal
  ) then
    create trigger set_languages_updated_at
      before update on public.languages
      for each row execute function public.set_updated_at();
  end if;
end $$;

commit;
