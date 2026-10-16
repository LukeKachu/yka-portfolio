-- Additive, re-runnable. Existing messages and RLS policies are preserved.
begin;

alter table public.contact_messages add column if not exists phone text;
alter table public.contact_messages add column if not exists request_id uuid;
create unique index if not exists contact_messages_request_id_idx on public.contact_messages(request_id);

create or replace function public.submit_contact_message_v2(
  p_name text, p_email text, p_phone text, p_reason text, p_message text,
  p_fingerprint text, p_request_id uuid, p_user_agent text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  existing public.contact_messages%rowtype;
  new_id uuid;
begin
  if p_request_id is null or p_phone is null or length(trim(p_phone)) not between 7 and 30
     or trim(p_phone) !~ '^\+?[0-9 ().-]+$'
     or length(regexp_replace(p_phone,'[^0-9]','','g')) not between 7 and 15
     or p_name is null or p_email is null or p_reason is null or p_message is null or p_fingerprint is null
  then raise exception 'Invalid contact submission'; end if;

  -- Serialize a small-volume portfolio inbox: rate checks and retries cannot race.
  perform pg_advisory_xact_lock(724016007);
  select * into existing from public.contact_messages where request_id = p_request_id;
  if found then
    if existing.name = trim(p_name) and existing.email = lower(trim(p_email))
       and existing.phone = trim(p_phone) and existing.reason = p_reason and existing.message = trim(p_message)
       and existing.request_fingerprint = p_fingerprint and existing.created_at > now() - interval '23 hours'
    then return existing.id; end if;
    raise exception 'Invalid contact submission';
  end if;

  -- Reuse the existing validation, hourly/daily rate limits and authorization model.
  new_id := public.submit_contact_message(p_name,p_email,p_reason,p_message,p_fingerprint,p_user_agent);
  update public.contact_messages set phone = trim(p_phone), request_id = p_request_id where id = new_id;
  return new_id;
end;
$$;

revoke all on function public.submit_contact_message_v2(text,text,text,text,text,text,uuid,text) from public;
grant execute on function public.submit_contact_message_v2(text,text,text,text,text,text,uuid,text) to anon,authenticated;

commit;
