-- Post impressions are separate from video plays. No existing constraints,
-- authorization, rows or metrics are changed. Safe to run repeatedly.
begin;
alter table public.projects
  add column if not exists source_impressions bigint,
  add column if not exists source_impressions_date date,
  add column if not exists source_impressions_url text;
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.projects'::regclass and conname='projects_source_impressions_valid') then
    alter table public.projects add constraint projects_source_impressions_valid check (
      source_impressions is null or (
        source_impressions >= 0 and source_impressions_date is not null
        and source_impressions_url is not null
        and source_impressions_url ~ '^https://(www\.)?(x\.com|twitter\.com)/[A-Za-z0-9_]+/status/[0-9]+/?$'
      )
    );
  end if;
end $$;
commit;
