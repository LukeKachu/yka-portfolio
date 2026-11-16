-- Stage 1: prepare the new protected path WITHOUT interrupting the deployed v2 form.
-- Run 009 only AFTER runtime configuration, deployment and a real delivery test.
begin;

create schema if not exists portfolio_private;
revoke all on schema portfolio_private from public, anon, authenticated;

create table if not exists portfolio_private.contact_gateway (
  singleton boolean primary key default true check (singleton),
  secret text not null check (secret ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);
alter table portfolio_private.contact_gateway add column if not exists verified_at timestamptz;
alter table portfolio_private.contact_gateway enable row level security;
revoke all on table portfolio_private.contact_gateway from public, anon, authenticated;
-- Generated inside PostgreSQL, never embedded in Git or the public schema.
-- Rerunning preserves the key and all existing data.
insert into portfolio_private.contact_gateway(singleton,secret)
values (true,replace(gen_random_uuid()::text || gen_random_uuid()::text,'-',''))
on conflict (singleton) do nothing;

create or replace function public.submit_contact_message_v3(
  p_name text, p_email text, p_phone text, p_reason text, p_message text,
  p_fingerprint text, p_request_id uuid, p_user_agent text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  supplied text;
  expected text;
  normalized_phone text := nullif(trim(p_phone),'');
  existing public.contact_messages%rowtype;
  new_id uuid;
begin
  -- PostgREST supplies request headers. Browser-supplied public API keys alone
  -- cannot authorize this function; only the Next.js server knows this key.
  begin
    supplied := current_setting('request.headers',true)::jsonb ->> 'x-contact-gateway-key';
  exception when others then
    raise exception 'Contact gateway authorization required' using errcode = '42501';
  end;
  select secret into expected from portfolio_private.contact_gateway where singleton;
  if expected is null or supplied is null or length(supplied) <> 64
     or sha256(convert_to(supplied,'UTF8')) <> sha256(convert_to(expected,'UTF8')) then
    raise exception 'Contact gateway authorization required' using errcode = '42501';
  end if;

  if p_request_id is null or p_name is null or p_email is null or p_reason is null
     or p_message is null or p_fingerprint is null
     or length(trim(p_name)) not between 2 and 100 or p_name ~ E'[\r\n]'
     or length(trim(p_email)) not between 5 and 200
     or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
     or p_reason not in ('project','opportunity','other')
     or length(trim(p_message)) not between 20 and 4000
     or p_fingerprint !~ '^[a-f0-9]{64}$'
     or (normalized_phone is not null and (
       length(normalized_phone) not between 7 and 30
       or normalized_phone !~ '^\+?[0-9 ().-]+$'
       or length(regexp_replace(normalized_phone,'[^0-9]','','g')) not between 7 and 15))
  then raise exception 'Invalid contact submission'; end if;

  perform pg_advisory_xact_lock(724016007);
  select * into existing from public.contact_messages where request_id = p_request_id;
  if found then
    if existing.name = trim(p_name) and existing.email = lower(trim(p_email))
       and nullif(trim(existing.phone),'') is not distinct from normalized_phone
       and existing.reason = p_reason and existing.message = trim(p_message)
       and existing.request_fingerprint = p_fingerprint
       and existing.created_at > now() - interval '23 hours'
    then return existing.id; end if;
    raise exception 'Invalid contact submission';
  end if;

  -- The owner can still call the existing validator after its public grants are
  -- revoked in stage 2. Its existing hourly/email limits remain in force.
  new_id := public.submit_contact_message(p_name,p_email,p_reason,p_message,p_fingerprint,p_user_agent);
  update public.contact_messages set phone = normalized_phone, request_id = p_request_id where id = new_id;
  update portfolio_private.contact_gateway set verified_at = coalesce(verified_at,now()) where singleton;
  return new_id;
end;
$$;

revoke all on function public.submit_contact_message_v3(text,text,text,text,text,text,uuid,text) from public;
grant execute on function public.submit_contact_message_v3(text,text,text,text,text,text,uuid,text) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
