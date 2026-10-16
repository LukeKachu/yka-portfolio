-- Three user-supplied TikTok publications. Public profile counters observed
-- 2026-10-16: 748, 1788, 960. No guessed dates, roles or private analytics.
-- The supplied Instagram DdojM1qOHo0 is already present; do not duplicate it.
-- Existing content, metrics, publication settings and permissions are untouched.
begin;
do $$
declare item record; brand uuid; project uuid; matches integer; next_order integer;
begin
  perform pg_advisory_xact_lock(16102026,6);
  select id into strict brand from public.brands where slug='okx-tr';
  select coalesce(max(sort_order),0)+1 into next_order from public.projects;
  for item in select * from (values
    ('okx-tr-bitcoin-doblo','7686175642047614229','OKX TR | Bitcoin ve Doblo Farı','OKX TR | Bitcoin and a Doblo Headlight',
      '1 Bitcoin ile kaç Doblo sağ ön farı alabilirsin?','How many right headlights for a Doblo could you buy with one Bitcoin?',748),
    ('okx-tr-2020-bitcoin','7683145563990199572','OKX TR | 2020: Bedelli Askerlik ve Bitcoin','OKX TR | 2020: Military Service Fees and Bitcoin',
      '2020 yılında bedelli askerlik yapmak yerine Bitcoin alabilseydin ne olurdu?','What if you had bought Bitcoin instead of paying for military service in 2020?',1788),
    ('okx-tr-2025-altin','7681703348218711304','OKX TR | 2025: Düğün Bütçesi ve Altın','OKX TR | 2025: A Wedding Budget and Gold',
      '2025 yılında evlenmek yerine altın alsaydınız ne olurdu?','What if you had bought gold instead of getting married in 2025?',960)
  ) as v(slug,source_id,title_tr,title_en,summary_tr,summary_en,views)
  loop
    select count(distinct p.id), min(p.id::text)::uuid into matches,project
    from public.projects p left join public.project_links l on l.project_id=p.id
    where p.slug=item.slug or l.url ~ ('^https://(www\.)?tiktok\.com/@[^/]+/video/' || item.source_id || '(/|[?#]|$)');
    if matches > 1 then raise exception 'Ambiguous existing publication: %',item.source_id; end if;
    if matches = 0 then
      insert into public.projects(internal_name,slug,brand_id,title_tr,title_en,short_description_tr,short_description_en,
        translation_status_tr,translation_status_en,published,sort_order,source_views,source_views_platform,source_views_date,source_views_url)
      values(item.title_tr,item.slug,brand,item.title_tr,item.title_en,item.summary_tr,item.summary_en,
        'approved','needs_review',true,next_order,item.views,'tiktok',date '2026-10-16','https://www.tiktok.com/@okxturkiye/video/'||item.source_id)
      returning id into project;
      insert into public.project_links(project_id,platform,url,label_tr,label_en)
      values(project,'tiktok','https://www.tiktok.com/@okxturkiye/video/'||item.source_id,'TikTok üzerinde izle','Watch on TikTok');
      next_order := next_order + 1;
    end if;
  end loop;
end $$;
commit;
