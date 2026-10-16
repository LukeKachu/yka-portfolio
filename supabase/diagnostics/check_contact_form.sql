-- Read-only. Does not send an email or insert a contact message.
select
  to_regclass('public.contact_messages') is not null as contact_table_exists,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='contact_messages' and column_name='phone') as phone_exists,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='contact_messages' and column_name='request_id') as request_id_exists,
  coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.contact_messages')),false) as rls_enabled,
  to_regprocedure('public.is_admin()') is not null as admin_check_exists,
  to_regprocedure('public.submit_contact_message(text,text,text,text,text,text)') is not null as submit_function_exists,
  to_regprocedure('public.submit_contact_message_v2(text,text,text,text,text,text,uuid,text)') is not null as submit_v2_exists,
  to_regclass('public.contact_messages_request_id_idx') is not null as deduplication_index_exists;

select policyname,roles,cmd,qual,with_check
from pg_policies
where schemaname='public' and tablename='contact_messages'
order by policyname;
