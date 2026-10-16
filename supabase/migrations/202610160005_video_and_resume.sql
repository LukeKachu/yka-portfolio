-- Additive, re-runnable migration. Existing content and authorization remain intact.
begin;

alter table public.projects
  add column if not exists stream_video_id text,
  add column if not exists stream_status text,
  add column if not exists stream_preview_url text,
  add column if not exists stream_duration_seconds numeric,
  add column if not exists pending_stream_video_id text,
  add column if not exists pending_stream_status text,
  add column if not exists stream_previous_video_ids text[] not null default '{}',
  add column if not exists source_views bigint,
  add column if not exists source_views_platform text,
  add column if not exists source_views_date date,
  add column if not exists source_views_url text;

do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.projects'::regclass and conname='projects_source_views_valid') then
    alter table public.projects add constraint projects_source_views_valid check (
      source_views is null or (source_views >= 0 and source_views_platform is not null and source_views_platform in ('instagram','youtube','tiktok','campaign') and source_views_date is not null)
    );
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.projects'::regclass and conname='projects_stream_status_valid') then
    alter table public.projects add constraint projects_stream_status_valid check (stream_status is null or stream_status in ('uploading','processing','ready','error'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.projects'::regclass and conname='projects_pending_stream_status_valid') then
    alter table public.projects add constraint projects_pending_stream_status_valid check (pending_stream_status is null or pending_stream_status in ('uploading','processing','ready','error'));
  end if;
end $$;

alter table public.education add column if not exists program_tr text, add column if not exists program_en text;

-- One transaction for a reviewed CV draft. No existing records are overwritten.
-- An advisory lock serializes imports and prevents double-click/concurrent duplicates.
create or replace function public.import_resume_draft(p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = public
as $$
declare item jsonb; created_count integer := 0; skipped_count integer := 0;
begin
  if not public.is_admin() then raise exception 'Administrator authorization required'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'Invalid draft'; end if;
  perform pg_advisory_xact_lock(16102026, 5);

  for item in select * from jsonb_array_elements(coalesce(p_payload->'experiences','[]'::jsonb)) loop
    if nullif(trim(item->>'company'),'') is null or nullif(item->>'start_date','') is null then raise exception 'Company and start date are required'; end if;
    if exists (select 1 from public.experiences where lower(trim(company))=lower(trim(item->>'company')) and start_date=(item->>'start_date')::date) then
      skipped_count := skipped_count + 1;
    else
      insert into public.experiences(company,job_title_tr,job_title_en,start_date,end_date,current_position,bullets_tr,bullets_en,published,sort_order)
      values(trim(item->>'company'),item->>'job_title_tr',item->>'job_title_en',(item->>'start_date')::date,nullif(item->>'end_date','')::date,
        coalesce((item->>'current_position')::boolean,false),
        array(select jsonb_array_elements_text(coalesce(item->'bullets_tr','[]'))),array(select jsonb_array_elements_text(coalesce(item->'bullets_en','[]'))),false,created_count);
      created_count := created_count + 1;
    end if;
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_payload->'education','[]'::jsonb)) loop
    if nullif(trim(item->>'institution'),'') is null then raise exception 'Institution required'; end if;
    if exists (select 1 from public.education where lower(trim(institution))=lower(trim(item->>'institution')) and start_date is not distinct from nullif(item->>'start_date','')::date) then
      skipped_count := skipped_count + 1;
    else
      insert into public.education(institution,program,program_tr,program_en,start_date,end_date,description_tr,description_en,published,sort_order)
      values(trim(item->>'institution'),coalesce(item->>'program',''),item->>'program_tr',item->>'program_en',nullif(item->>'start_date','')::date,nullif(item->>'end_date','')::date,item->>'description_tr',item->>'description_en',false,created_count);
      created_count := created_count + 1;
    end if;
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_payload->'volunteering','[]'::jsonb)) loop
    if nullif(trim(item->>'organization'),'') is null then raise exception 'Organization required'; end if;
    if exists (select 1 from public.volunteering where lower(trim(organization))=lower(trim(item->>'organization')) and start_date is not distinct from nullif(item->>'start_date','')::date) then
      skipped_count := skipped_count + 1;
    else
      insert into public.volunteering(organization,role_tr,role_en,start_date,end_date,bullets_tr,bullets_en,published,sort_order)
      values(trim(item->>'organization'),item->>'role_tr',item->>'role_en',nullif(item->>'start_date','')::date,nullif(item->>'end_date','')::date,
        array(select jsonb_array_elements_text(coalesce(item->'bullets_tr','[]'))),array(select jsonb_array_elements_text(coalesce(item->'bullets_en','[]'))),false,created_count);
      created_count := created_count + 1;
    end if;
  end loop;
  return jsonb_build_object('created',created_count,'skipped',skipped_count);
end $$;
revoke all on function public.import_resume_draft(jsonb) from public, anon;
grant execute on function public.import_resume_draft(jsonb) to authenticated;

commit;
