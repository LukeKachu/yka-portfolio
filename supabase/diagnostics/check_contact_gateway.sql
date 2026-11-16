-- READ ONLY. No secret values, messages or personal data are returned.
select
  to_regprocedure('public.submit_contact_message_v3(text,text,text,text,text,text,uuid,text)') is not null as gateway_exists,
  coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.contact_messages')),false) as contact_rls_enabled;

select r.rolname as role_name, p.oid::regprocedure::text as function_name,
  has_function_privilege(r.oid,p.oid,'execute') as can_execute
from pg_roles r cross join pg_proc p join pg_namespace n on n.oid=p.pronamespace
where r.rolname in ('anon','authenticated') and n.nspname='public'
  and p.proname in ('submit_contact_message','submit_contact_message_v2','submit_contact_message_v3')
order by role_name,function_name;
-- Expected after activation: v1/v2 false, v3 true (server key also required).

select r.rolname as role_name,
  has_table_privilege(r.oid,c.oid,'insert') as can_insert_directly
from pg_roles r cross join pg_class c join pg_namespace n on n.oid=c.relnamespace
where r.rolname in ('anon','authenticated') and n.nspname='public' and c.relname='contact_messages';
-- Expected after activation: false for both roles. Admin SELECT/UPDATE policies remain.

select n.nspname as schema_name,c.relname as table_name,r.rolname as role_name,
  has_schema_privilege(r.oid,n.oid,'usage') as schema_access,
  has_table_privilege(r.oid,c.oid,'select') as table_read_access
from pg_namespace n join pg_class c on c.relnamespace=n.oid cross join pg_roles r
where n.nspname='portfolio_private' and c.relname='contact_gateway' and r.rolname in ('anon','authenticated');
-- Expected: all false. The private configuration must not be exposed in API schemas.
