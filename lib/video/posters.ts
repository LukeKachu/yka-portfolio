// Stable, small WebP copies of the actual publication covers, not expiring
// social CDN URLs. A cover uploaded in the admin always takes precedence.
const posters: Record<string,string> = {
  'tiktok:7690632816249277703':'/media/posters/okx-bitcoin-pirinc.webp',
}

export function publicationPoster(key:string | undefined) {
  return key ? posters[key] : undefined
}
