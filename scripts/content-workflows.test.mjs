import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {PGlite} from '@electric-sql/pglite'
import {extractText, getDocumentProxy} from 'unpdf'
import sharp from 'sharp'
import {resumeDraftSchema} from '../lib/resume/schema.ts'
import {readPublicResult} from '../lib/data/read-result.ts'
import {socialSource, isVideoProject, summarizeReach, metricCount, compactReach} from '../lib/video/social.ts'
import {publicationPoster} from '../lib/video/posters.ts'

test('a thrown Supabase transport failure becomes an unavailable result', async () => {
  for (const error of [
    new TypeError('fetch failed'),
    new Error('Request failed', {cause: Object.assign(new Error('DNS failed'), {code:'ENOTFOUND'})}),
    new DOMException('Request timed out', 'TimeoutError'),
    new DOMException('Request aborted', 'AbortError'),
  ]) {
    const result = await readPublicResult(async () => {throw error})
    assert.equal(result.data,null)
    assert.match(result.error.message,/network connection unavailable/)
  }
})

test('public reads preserve successful data and do not hide unrelated errors', async () => {
  const data = {full_name:'Yusuf Kerim Altay'}
  assert.deepEqual(await readPublicResult(async () => ({data,error:null})),{data,error:null})
  const schemaError = {code:'42703',message:'An expected column is missing'}
  assert.deepEqual(await readPublicResult(async () => ({data:null,error:schemaError})),{data:null,error:schemaError})
  const programmingError = new TypeError('Invalid property access')
  await assert.rejects(readPublicResult(async () => {throw programmingError}), error => error === programmingError)
  const nextSignal = Object.assign(new Error('Next.js request rendering signal'), {code:'NEXT_PRERENDER_INTERRUPTED'})
  await assert.rejects(readPublicResult(async () => {throw nextSignal}), error => error === nextSignal)
})

// All database fixtures live only in an in-memory PostgreSQL instance.
// This test never reads .env.local and never contacts Supabase.
test('video migration and CV import preserve data, permissions and repeatability', async () => {
  const db = new PGlite()
  try {
    const original = await readFile(new URL('../supabase/migrations/202608300001_initial_portfolio.sql',import.meta.url),'utf8')
    const migration = await readFile(new URL('../supabase/migrations/202610160005_video_and_resume.sql',import.meta.url),'utf8')
    assert.doesNotMatch(migration,/\b(?:drop\s+(?:table|schema)|truncate|disable\s+row\s+level\s+security)\b/i)
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.auth_uid',true),'')::uuid $$;`)
    const tables = Array.from(original.matchAll(/create table public\.[\s\S]*?\n\);/g),match=>match[0])
    assert.equal(tables.length,15)
    await db.exec(tables.join('\n'))
    await db.exec(`create function public.is_admin() returns boolean language sql stable security definer set search_path=public
      as $$ select exists(select 1 from public.admin_users where user_id=auth.uid()) $$;
      grant usage on schema public,auth to anon,authenticated;
      grant select,insert,update on all tables in schema public to authenticated;
      grant select on public.experiences,public.education,public.volunteering to anon;
      insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111');
      insert into public.admin_users(user_id) values ('11111111-1111-4111-8111-111111111111');
      insert into public.experiences(company,start_date,job_title_en,published,bullets_en)
        values ('Existing employer','2020-01-01','Existing role',true,array['Keep this text']);`)
    for (const table of ['experiences','education','volunteering']) await db.exec(`alter table public.${table} enable row level security;
      create policy admin_write on public.${table} for all to authenticated using(public.is_admin()) with check(public.is_admin());
      create policy public_read on public.${table} for select to anon,authenticated using(published);`)
    await db.exec(migration)
    await db.exec(migration)
    const before = await db.query(`select company,bullets_en from public.experiences`)
    assert.deepEqual(before.rows,[{company:'Existing employer',bullets_en:['Keep this text']}])

    await db.exec(`set role authenticated; select set_config('test.auth_uid','11111111-1111-4111-8111-111111111111',false)`)
    const draft = resumeDraftSchema.parse({experiences:[{company:'Existing employer',job_title_en:'Do not overwrite',start_date:'2020-01-01'}, {company:'New employer',job_title_tr:'İçerik üreticisi',start_date:'2024-01-01',bullets_tr:['Bir içerik hazırladım.']}],education:[{institution:'University',program:'Degree',program_tr:'Bölüm',program_en:'Degree'}],volunteering:[{organization:'Volunteer group',role_tr:'Gönüllü'}]})
    const first = await db.query(`select public.import_resume_draft($1::jsonb) as result`,[JSON.stringify(draft)])
    assert.deepEqual(first.rows[0].result,{created:3,skipped:1})
    const second = await db.query(`select public.import_resume_draft($1::jsonb) as result`,[JSON.stringify(draft)])
    assert.deepEqual(second.rows[0].result,{created:0,skipped:4})
    for (const table of ['experiences','education','volunteering']) {
      const count = await db.query(`select count(*)::int as count from public.${table} where not published`)
      assert.equal(count.rows[0].count,1)
    }
    assert.equal((await db.query(`select job_title_en from public.experiences where company='Existing employer'`)).rows[0].job_title_en,'Existing role')
    assert.equal((await db.query(`select program_tr from public.education where institution='University'`)).rows[0].program_tr,'Bölüm')

    // Invalid entries roll back earlier inserts from the same RPC.
    const invalid = {experiences:[{company:'Must roll back',start_date:'2023-01-01',bullets_tr:[],bullets_en:[]},{company:'Invalid',start_date:'not-a-date'}]}
    await assert.rejects(db.query(`select public.import_resume_draft($1::jsonb)`,[JSON.stringify(invalid)]))
    assert.equal((await db.query(`select count(*)::int as count from public.experiences where company='Must roll back'`)).rows[0].count,0)

    // A logged-in non-admin cannot import; anonymous users cannot call the RPC.
    await db.exec(`select set_config('test.auth_uid','',false)`)
    await assert.rejects(db.query(`select public.import_resume_draft('{}'::jsonb)`),/Administrator authorization required/)
    await db.exec('reset role; set role anon')
    await assert.rejects(db.query(`select public.import_resume_draft('{}'::jsonb)`),/permission denied/)
    assert.equal((await db.query(`select count(*)::int as count from public.experiences`)).rows[0].count,1)
    await assert.rejects(db.query(`insert into public.experiences(company,start_date) values('Forbidden','2024-01-01')`),/permission denied/)
    await db.exec('reset role')
    await assert.rejects(db.query(`insert into public.projects(internal_name,slug,source_views,source_views_date) values('Invalid metric','invalid-metric',12,'2024-01-01')`),/projects_source_views_valid/)
    await assert.rejects(db.query(`insert into public.projects(internal_name,slug,source_views,source_views_platform,source_views_date) values('Negative metric','negative-metric',-1,'youtube','2024-01-01')`),/projects_source_views_valid/)
    const socialMigration = await readFile(new URL('../supabase/migrations/202610160006_post_impressions.sql',import.meta.url),'utf8')
    const content = await readFile(new URL('../supabase/content/20261016_okx_videos.sql',import.meta.url),'utf8')
    for (const sql of [socialMigration,content]) assert.doesNotMatch(sql,/\b(?:drop|truncate|delete|disable\s+row\s+level\s+security)\b/i)
    const policiesBefore = (await db.query('select * from pg_policies order by tablename,policyname')).rows
    await db.exec(socialMigration)
    await db.exec(socialMigration)
    await db.exec(`insert into public.brands(name,slug) values('OKX TR','okx-tr')`)
    await db.exec(content)
    await db.exec(content)
    assert.equal((await db.query('select count(*)::int as count from public.projects')).rows[0].count,5)
    assert.equal((await db.query('select count(*)::int as count from public.project_links')).rows[0].count,5)
    const counters = (await db.query('select sum(source_views)::text as views,sum(source_impressions)::text as impressions from public.projects')).rows[0]
    assert.deepEqual(counters,{views:'3101',impressions:'13145634'})
    await db.exec(`update public.projects set title_tr='Reviewed title',source_views=2400 where slug='okx-tr-otomatik-alim';
      update public.project_links set url='https://www.instagram.com/p/DdojM1qOHo0/?tracking=example' where url like '%DdojM1qOHo0%';`)
    await db.exec(content)
    assert.equal((await db.query('select count(*)::int as count from public.projects')).rows[0].count,5)
    assert.equal((await db.query(`select title_tr from public.projects where slug='okx-tr-otomatik-alim'`)).rows[0].title_tr,'Reviewed title')
    assert.deepEqual((await db.query('select * from pg_policies order by tablename,policyname')).rows,policiesBefore)
    await assert.rejects(db.query(`insert into public.projects(internal_name,slug,source_impressions,source_impressions_date,source_impressions_url) values('Invalid','invalid-post',-1,'2026-10-16','https://x.com/i/status/123')`),/projects_source_impressions_valid/)
    const moreContent = await readFile(new URL('../supabase/content/20261016_more_okx_tiktok.sql',import.meta.url),'utf8')
    assert.doesNotMatch(moreContent,/\b(?:drop|truncate|delete|disable\s+row\s+level\s+security)\b/i)
    await db.exec(moreContent)
    await db.exec(moreContent)
    assert.equal((await db.query('select count(*)::int as count from public.projects')).rows[0].count,8)
    assert.equal((await db.query('select count(*)::int as count from public.project_links')).rows[0].count,8)
    assert.equal((await db.query('select sum(source_views)::int as views from public.projects')).rows[0].views,6698)
    assert.equal((await db.query(`select title_tr from public.projects where slug='okx-tr-otomatik-alim'`)).rows[0].title_tr,'Reviewed title')
  } finally {await db.close()}
})

test('social publications are classified and canonicalized without trusting arbitrary embed HTML', () => {
  assert.equal(socialSource('https://www.instagram.com/okx_turkiye/reel/DdojM1qOHo0/?foo=bar').key,socialSource('https://www.instagram.com/p/DdojM1qOHo0/').key)
  assert.equal(socialSource('https://twitter.com/OKXTurkiye/status/2105692271408742418?s=46').key,'x:2105692271408742418')
  assert.equal(socialSource('https://www.tiktok.com/@okxturkiye/video/7690632816249277703').platform,'tiktok')
  assert.equal(socialSource('https://www.youtube.com/watch?v=GtiMnV4ito8').id,'GtiMnV4ito8')
  for (const url of ['https://instagram.com.evil.example/p/123/','javascript:alert(1)','https://x.com@evil.example/a/status/123','<script>alert(1)</script>','http://x.com/a/status/123']) assert.equal(socialSource(url),null)
  assert.equal(isVideoProject({project_links:[{platform:'other',url:'https://x.com/okxturkiye/status/123'}]}),true)
  assert.equal(isVideoProject({project_links:[{platform:'website',url:'https://smartup.network/'}]}),false)
})

test('reach sums snapshots, separates post views, excludes drafts, unknowns and duplicate publications', () => {
  const video = {id:'ig',published:true,project_links:[{url:'https://www.instagram.com/p/DdojM1qOHo0/'}],source_views:2299,source_views_platform:'instagram',source_views_date:'2026-10-16',source_views_url:'https://www.instagram.com/p/DdojM1qOHo0/'}
  const x = {id:'x',published:true,project_links:[{url:'https://x.com/i/status/123'}],source_impressions:13145634,source_impressions_date:'2026-10-16',source_impressions_url:'https://x.com/i/status/123'}
  const missing = {id:'missing',published:true,project_links:[{url:'https://www.tiktok.com/@okxturkiye/video/789'}]}
  const stats = summarizeReach([video,x,missing,{...video,id:'copy',source_views_url:'https://www.instagram.com/okx_turkiye/reel/DdojM1qOHo0/?x=1'},{...video,id:'draft',published:false,source_views:999999}])
  assert.equal(stats.total,13147933n)
  assert.equal(stats.videoViews,2299n)
  assert.equal(stats.postViews,13145634n)
  assert.equal(stats.missing,1)
  assert.equal(summarizeReach([{...video,source_views:null}]).hasMetrics,false)
  assert.equal(summarizeReach([{...video,source_views_date:'2026-02-31'}]).total,0n)
  assert.equal(summarizeReach([{...video,source_views_url:'https://x.com/i/status/123'}]).total,0n)
  assert.equal(metricCount(-1),null)
  assert.equal(metricCount(Number.MAX_SAFE_INTEGER+1),null)
  assert.equal(metricCount('999999999999999999'),999999999999999999n)
})

test('compact reach never rounds up and remains localized', () => {
  assert.deepEqual(compactReach(13148735n,'tr'),{value:'13',unit:'M',plus:true})
  assert.deepEqual(compactReach(13148735n,'en'),{value:'13',unit:'M',plus:true})
  assert.deepEqual(compactReach(1999999n,'en'),{value:'1',unit:'M',plus:true})
  assert.deepEqual(compactReach(13000000n,'tr'),{value:'13',unit:'M',plus:false})
  assert.deepEqual(compactReach(802n,'tr'),{value:'802',unit:'',plus:false})
})

test('social preview covers are local, lightweight real images, not blank placeholders', async () => {
  for (const key of ['tiktok:7690632816249277703']) {
    const path = publicationPoster(key)
    assert.ok(path?.startsWith('/media/posters/'))
    const bytes = await readFile(new URL(`../public${path}`,import.meta.url))
    assert.ok(bytes.length < 200_000)
    const {channels} = await sharp(bytes).stats()
    assert.ok(channels.some(channel => channel.stdev > 10),'A real, non-blank video frame is required')
  }
  const card = await readFile(new URL('../components/public/project-card.tsx',import.meta.url),'utf8')
  assert.doesNotMatch(card,/ProjectMetrics|project-metrics|source_views|ölçümü bekleniyor/)
  for (const file of ['video-player.tsx','x-embed.tsx']) {
    const component = await readFile(new URL(`../components/public/${file}`,import.meta.url),'utf8')
    assert.doesNotMatch(component,/media-no-poster|IN MOTION/)
  }
  assert.equal(publicationPoster('x:2105692271408742418'),undefined)
  const xEmbed = await readFile(new URL('../components/public/x-embed.tsx',import.meta.url),'utf8')
  assert.doesNotMatch(xEmbed,/VideoPreview|poster|setOpened|widgets\.js/)
  assert.match(xEmbed,/platform\.twitter\.com\/embed\/Tweet\.html/)
  const home = await readFile(new URL('../app/[locale]/page.tsx',import.meta.url),'utf8')
  assert.ok(home.indexOf('<PortfolioReach') > home.indexOf('id="selected-work"'))
})

test('PDF extraction works without an API key or a personal CV in the repository', async () => {
  // A generated, non-personal PDF fixture keeps clean GitHub/CI checks independent
  // of the owner's private files. Nothing is uploaded or inserted into a database.
  const text = 'Portable document extraction regression check.'
  const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ]
  let source = '%PDF-1.4\n'
  const offsets = [0]
  for (const [index,object] of objects.entries()) {
    offsets.push(Buffer.byteLength(source))
    source += `${index+1} 0 obj\n${object}\nendobj\n`
  }
  const xref = Buffer.byteLength(source)
  source += `xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  const pdf = await getDocumentProxy(new Uint8Array(Buffer.from(source)))
  try {
    const result = await extractText(pdf,{mergePages:true})
    assert.equal(result.totalPages,1)
    assert.ok(result.text.includes(text))
  } finally {await pdf.loadingTask.destroy()}
})

const localCv = new URL('../public/cv/Yusuf-Kerim-Altay-Social-Media-CV.pdf',import.meta.url)
test('the optional local CV remains readable without publishing it to GitHub', {skip:!existsSync(localCv)}, async () => {
  const bytes = new Uint8Array(await readFile(localCv))
  const pdf = await getDocumentProxy(bytes)
  try {
    const result = await extractText(pdf,{mergePages:true})
    assert.ok(result.totalPages > 0 && result.totalPages <= 30)
    assert.ok(result.text.length > 100)
  } finally {await pdf.loadingTask.destroy()}
})
