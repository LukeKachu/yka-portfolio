// Read-only preflight. Does not log credentials or sign into an admin account.
import {createClient} from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) {console.log('Supabase configuration missing.'); process.exit(1)}
const client = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input, init) => fetch(input,{...init,signal:AbortSignal.timeout(15000)})}})
let networkError = null
try {await fetch(new URL('/rest/v1/',url),{headers:{apikey:key},signal:AbortSignal.timeout(15000)})}
catch (error) {networkError=error.cause?.code || error.name}
const [projects,columns] = await Promise.all([
  client.from('projects').select('id',{count:'exact',head:true}).eq('published',true),
  client.from('projects').select('stream_video_id,stream_status,source_views,source_views_platform,source_views_date').limit(1),
])
console.log(JSON.stringify({
  supabaseReachable:!projects.error,
  networkError,
  publishedProjects:projects.count,
  databaseStatus:projects.status,
  databaseErrorCode:projects.error?.code || null,
  databaseErrorCategory:projects.error ? /invalid api key/i.test(projects.error.message) ? 'invalid-key' : /permission denied/i.test(projects.error.message) ? 'permission-denied' : /schema cache|does not exist/i.test(projects.error.message) ? 'schema-missing' : /fetch failed|network|timeout|aborted/i.test(projects.error.message) ? 'network' : 'database-error' : null,
  videoMigrationApplied:projects.error ? 'unverified' : !columns.error,
  cloudflareConfigured:Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_STREAM_API_TOKEN),
  resumeAssistantConfigured:Boolean(process.env.RESUME_AI_API_KEY && process.env.RESUME_AI_MODEL),
},null,2))
if (projects.error) process.exitCode=1
