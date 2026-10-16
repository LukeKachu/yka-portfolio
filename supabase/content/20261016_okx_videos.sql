-- User-requested public portfolio publications. Measured on 2026-10-16.
-- Instagram Reels profile: DdojM1qOHo0 = 2,299 video views.
-- TikTok profile: 7690632816249277703 = 802 video views.
-- X post accessibility label: 2105692271408742418 = 13,145,634 POST views.
-- The other two Instagram counters are unavailable: intentionally NULL.
-- Run after 202610160006_post_impressions.sql. No auth/RLS changes.
begin;
do $$
declare
  item record;
  brand uuid;
  project uuid;
  matches integer;
  base_order integer;
begin
  perform pg_advisory_xact_lock(16102026,6);
  select id into strict brand from public.brands where slug='okx-tr';
  -- Only new items receive ordering values. Existing ordering is preserved.
  select least(coalesce(min(sort_order),0),0)-5 into base_order from public.projects;
  for item in select * from (values
    ('okx-tr-50-usdt-x','OKX TR | 50 USDT Kampanyası — X','OKX TR | 50 USDT Campaign — X',
      'Yeni kullanıcılara yönelik 50 USDT kampanyasının X yayını.','X publication of the 50 USDT new-user campaign.',
      'other','https://x.com/okxturkiye/status/2105692271408742418','2105692271408742418',null::bigint,13145634::bigint,0,true),
    ('okx-tr-otomatik-alim','OKX TR | Otomatik Alım','OKX TR | Recurring Buy',
      'Otomatik Alım: miktar ve zaman aralığı seçimini anlatan ürün videosu.','Product video introducing amount and schedule selection for Recurring Buy.',
      'instagram','https://www.instagram.com/okx_turkiye/reel/DdojM1qOHo0/','DdojM1qOHo0',2299::bigint,null::bigint,1,false),
    ('okx-tr-50-usdt-kampanya','OKX TR | 50 USDT — Yeni Kullanıcı Kampanyası','OKX TR | 50 USDT — New User Campaign',
      'Yeni kullanıcılara 50 USDT''ye varan ödül kampanyası için Instagram reklam videosu.','Instagram campaign video featuring rewards of up to 50 USDT for new users.',
      'instagram','https://www.instagram.com/p/DdlOencAO2I/','DdlOencAO2I',null::bigint,null::bigint,2,false),
    ('okx-tr-50-usdt-gorevler','OKX TR | Görevleri Tamamla, OKX Puanları Topla','OKX TR | Complete Tasks, Collect OKX Points',
      'Yeni kullanıcı kampanyasının görev ve OKX puanlarını öne çıkaran Instagram reklam videosu.','Instagram campaign video highlighting tasks and OKX points for new users.',
      'instagram','https://www.instagram.com/p/DdlOnNXAgjP/','DdlOnNXAgjP',null::bigint,null::bigint,3,false),
    ('okx-tr-bitcoin-pirinc','OKX TR | Bitcoin ve Pirinç Taneleri','OKX TR | Bitcoin in Grains of Rice',
      '1 Bitcoin''i pirinç taneleri ile saymaya çalışırsan ne kadar sürer?','How long would it take to count one Bitcoin in grains of rice?',
      'tiktok','https://www.tiktok.com/@okxturkiye/video/7690632816249277703','7690632816249277703',802::bigint,null::bigint,4,false)
  ) as v(slug,title_tr,title_en,summary_tr,summary_en,platform,url,source_id,views,impressions,position,featured)
  loop
    -- Match the source ID case-sensitively across tracking parameters and
    -- alternate Instagram /p/, /reel/ and account-qualified URL forms.
    select count(distinct p.id), min(p.id::text)::uuid into matches,project
    from public.projects p left join public.project_links l on l.project_id=p.id
    where p.slug=item.slug or (
      l.url ~ case item.platform
        when 'instagram' then '^https://(www\.)?instagram\.com/([^/]+/)?(p|reel|reels)/' || item.source_id || '(/|[?#]|$)'
        when 'tiktok' then '^https://(www\.)?tiktok\.com/@[^/]+/video/' || item.source_id || '(/|[?#]|$)'
        else '^https://(www\.)?(x\.com|twitter\.com)/[^/]+/status/' || item.source_id || '(/|[?#]|$)' end
    );
    if matches > 1 then raise exception 'Ambiguous existing publication: %',item.slug; end if;
    if matches = 0 then
      insert into public.projects(internal_name,slug,brand_id,title_tr,title_en,short_description_tr,short_description_en,
        translation_status_tr,translation_status_en,published,featured,sort_order,
        source_views,source_views_platform,source_views_date,source_views_url,
        source_impressions,source_impressions_date,source_impressions_url)
      values(item.title_tr,item.slug,brand,item.title_tr,item.title_en,item.summary_tr,item.summary_en,
        'approved','needs_review',true,item.featured,base_order+item.position,
        item.views,case when item.views is not null then item.platform end,
        case when item.views is not null then date '2026-10-16' end,case when item.views is not null then item.url end,
        item.impressions,case when item.impressions is not null then date '2026-10-16' end,case when item.impressions is not null then item.url end)
      returning id into project;
      insert into public.project_links(project_id,platform,url,label_tr,label_en,sort_order)
      values(project,item.platform,item.url,case when item.platform='other' then 'X üzerinde izle' else 'Kaynağı aç' end,
        case when item.platform='other' then 'Watch on X' else 'Open source' end,0);
    end if;
    -- Existing matches are left completely untouched, including publication,
    -- translations, newer metrics, links and attached media.
  end loop;
end $$;
commit;
