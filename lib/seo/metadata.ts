import type {Metadata} from 'next'

export function localizedPageMetadata(locale:'tr'|'en', path:string, title:string, description:string):Metadata {
  const suffix = path ? `/${path}` : ''
  const pageTitle = `${title} — YKA · Yusuf Kerim Altay`
  return {
    title:pageTitle, description,
    alternates:{canonical:`/${locale}${suffix}`,languages:{tr:`/tr${suffix}`,en:`/en${suffix}`,'x-default':`/en${suffix}`}},
    openGraph:{title:pageTitle,description,url:`/${locale}${suffix}`,locale:locale==='tr'?'tr_TR':'en_US',type:'website'},
    twitter:{card:'summary_large_image',title:pageTitle,description},
  }
}
