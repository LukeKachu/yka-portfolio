import {spawnSync} from 'node:child_process'

// Do not let Wrangler list local .env values as runtime bindings in its output.
// This command bundles locally only: it neither logs in nor deploys a Worker.
const result = spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--dry-run','--outdir','.open-next/dry-run'], {
  stdio:'inherit',
  env:{...process.env,CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV:'false',WRANGLER_SEND_METRICS:'false'},
})
if (result.error) throw result.error
process.exitCode = result.status ?? 1
