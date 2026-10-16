-- Read-only portfolio schema diagnostic. Every statement below is a SELECT.

with expected(table_name) as (
  values ('admin_users'),('brands'),('work_types'),('projects'),('project_work_types'),
         ('project_roles'),('project_media'),('project_links'),('experiences'),('education'),
         ('volunteering'),('skill_groups'),('skills'),('about'),('site_settings')
)
select 'table' as object_type, e.table_name as object_name,
       (c.oid is not null) as object_exists,
       coalesce(c.relrowsecurity,false) as rls_enabled
from expected e
left join pg_namespace n on n.nspname='public'
left join pg_class c on c.relnamespace=n.oid and c.relname=e.table_name and c.relkind in ('r','p')
order by e.table_name;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname='public' and tablename in (
  'admin_users','brands','work_types','projects','project_work_types','project_roles','project_media',
  'project_links','experiences','education','volunteering','skill_groups','skills','about','site_settings'
)) or (schemaname='storage' and tablename='objects' and policyname in (
  'public media read','admin media insert','admin media update','admin media delete'
))
order by schemaname,tablename,policyname;

with expected(bucket_id) as (values ('portfolio-public'),('resume-public'))
select 'storage_bucket' as object_type, e.bucket_id as object_name,
       (b.id is not null) as object_exists, b.public
from expected e left join storage.buckets b on b.id=e.bucket_id
order by e.bucket_id;

select 'function' as object_type, p.proname as object_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('is_admin','set_updated_at')
order by p.proname;

with expected(table_name,column_name) as (
  values
  ('admin_users','user_id'),('admin_users','created_at'),
  ('brands','id'),('brands','name'),('brands','slug'),('brands','logo_path'),('brands','website'),('brands','sort_order'),('brands','created_at'),('brands','updated_at'),
  ('work_types','id'),('work_types','internal_name'),('work_types','slug'),('work_types','label_tr'),('work_types','label_en'),('work_types','sort_order'),
  ('projects','id'),('projects','internal_name'),('projects','slug'),('projects','brand_id'),('projects','project_date'),('projects','cover_path'),('projects','primary_media_path'),('projects','live_url'),('projects','title_tr'),('projects','title_en'),('projects','short_description_tr'),('projects','short_description_en'),('projects','description_tr'),('projects','description_en'),('projects','context_tr'),('projects','context_en'),('projects','seo_title_tr'),('projects','seo_title_en'),('projects','seo_description_tr'),('projects','seo_description_en'),('projects','translation_status_tr'),('projects','translation_status_en'),('projects','featured'),('projects','published'),('projects','sort_order'),
  ('project_work_types','project_id'),('project_work_types','work_type_id'),
  ('project_roles','id'),('project_roles','project_id'),('project_roles','role_tr'),('project_roles','role_en'),('project_roles','sort_order'),
  ('project_media','id'),('project_media','project_id'),('project_media','kind'),('project_media','storage_path'),('project_media','alt_tr'),('project_media','alt_en'),('project_media','sort_order'),
  ('project_links','id'),('project_links','project_id'),('project_links','platform'),('project_links','url'),('project_links','label_tr'),('project_links','label_en'),('project_links','sort_order'),
  ('experiences','id'),('experiences','company'),('experiences','start_date'),('experiences','job_title_tr'),('experiences','job_title_en'),('experiences','bullets_tr'),('experiences','bullets_en'),('experiences','published'),('experiences','sort_order'),
  ('education','id'),('education','institution'),('education','program'),('education','published'),('education','sort_order'),
  ('volunteering','id'),('volunteering','organization'),('volunteering','role_tr'),('volunteering','role_en'),('volunteering','published'),('volunteering','sort_order'),
  ('skill_groups','id'),('skill_groups','title_tr'),('skill_groups','title_en'),('skill_groups','published'),('skill_groups','sort_order'),
  ('skills','id'),('skills','group_id'),('skills','name'),('skills','sort_order'),
  ('about','id'),('about','content_tr'),('about','content_en'),('about','published'),
  ('site_settings','id'),('site_settings','singleton_key'),('site_settings','full_name'),('site_settings','professional_title_tr'),('site_settings','professional_title_en'),('site_settings','resume_pdf_path')
)
select 'missing_column' as issue, e.table_name, e.column_name
from expected e
left join information_schema.columns c on c.table_schema='public' and c.table_name=e.table_name and c.column_name=e.column_name
where c.column_name is null
order by e.table_name,e.column_name;

with expected(object_type,object_name) as (
  values ('function','is_admin'),('function','set_updated_at'),
         ('bucket','portfolio-public'),('bucket','resume-public')
)
select e.object_type,e.object_name,'missing' as status
from expected e
where (e.object_type='function' and to_regprocedure(format('public.%I()',e.object_name)) is null)
   or (e.object_type='bucket' and not exists(select 1 from storage.buckets b where b.id=e.object_name))
order by e.object_type,e.object_name;
