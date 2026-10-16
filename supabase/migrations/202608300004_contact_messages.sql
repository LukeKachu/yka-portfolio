begin;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  reason text not null check (reason in ('project','opportunity','other')),
  message text not null,
  request_fingerprint text not null,
  user_agent text,
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
create index if not exists contact_messages_created_at_idx on public.contact_messages(created_at desc);
create index if not exists contact_messages_fingerprint_idx on public.contact_messages(request_fingerprint,created_at desc);

do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='contact_messages' and policyname='admins read contact messages') then
    create policy "admins read contact messages" on public.contact_messages for select to authenticated using (public.is_admin());
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='contact_messages' and policyname='admins update contact messages') then
    create policy "admins update contact messages" on public.contact_messages for update to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

create or replace function public.submit_contact_message(p_name text,p_email text,p_reason text,p_message text,p_fingerprint text,p_user_agent text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare new_id uuid;
begin
  if length(trim(p_name)) not between 2 and 100 or length(trim(p_email)) not between 5 and 200 or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or p_reason not in ('project','opportunity','other') or length(trim(p_message)) not between 20 and 4000 or length(p_fingerprint) < 32 then raise exception 'Invalid contact submission'; end if;
  if (select count(*) from public.contact_messages where request_fingerprint=p_fingerprint and created_at>now()-interval '1 hour')>=3 then raise exception 'Rate limit exceeded'; end if;
  if (select count(*) from public.contact_messages where lower(email)=lower(trim(p_email)) and created_at>now()-interval '1 day')>=10 then raise exception 'Rate limit exceeded'; end if;
  insert into public.contact_messages(name,email,reason,message,request_fingerprint,user_agent) values(trim(p_name),lower(trim(p_email)),p_reason,trim(p_message),p_fingerprint,left(p_user_agent,500)) returning id into new_id;
  return new_id;
end $$;

revoke all on function public.submit_contact_message(text,text,text,text,text,text) from public;
grant execute on function public.submit_contact_message(text,text,text,text,text,text) to anon,authenticated;

commit;
