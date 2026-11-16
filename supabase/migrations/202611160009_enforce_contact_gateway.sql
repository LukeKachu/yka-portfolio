-- Stage 2: ONLY AFTER 008 + the runtime secret + new code + a real delivery test.
-- Preserves every message, RLS policy and admin account. Re-runnable.
begin;

do $$ begin
  if to_regprocedure('public.submit_contact_message_v3(text,text,text,text,text,text,uuid,text)') is null
     or not exists(select 1 from portfolio_private.contact_gateway where singleton and length(secret)=64 and verified_at is not null)
  then raise exception 'Prepare migration 008, configure and test the new server gateway before activation'; end if;
end $$;

-- Deny the legacy unguarded entry points, including authenticated non-admins.
revoke all on function public.submit_contact_message(text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.submit_contact_message_v2(text,text,text,text,text,text,uuid,text) from public, anon, authenticated;
alter function public.submit_contact_message(text,text,text,text,text,text) set search_path = '';
-- No direct inserts, including through an accidentally permissive INSERT policy.
revoke insert on public.contact_messages from public, anon, authenticated;
alter table public.contact_messages enable row level security;

notify pgrst, 'reload schema';
commit;
