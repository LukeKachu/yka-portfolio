import {defineCloudflareConfig} from '@opennextjs/cloudflare'

// Public and admin content is request-rendered; no extra R2/KV resources are created.
export default defineCloudflareConfig()
