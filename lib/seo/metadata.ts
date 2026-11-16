import type {Metadata} from 'next'

export const portfolioShareImage = {url:'/yka-social.png',width:1200,height:630,alt:'YKA — Yusuf Kerim Altay · Social Media / Content / Digital'}

export function localizedPageMetadata(locale:'tr'|'en', path:string, title:string, description:string):Metadata {
  const suffix = path ? `/${path}` : ''
  const pageTitle = `${title} — YKA · Yusuf Kerim Altay`
  return {
    title:pageTitle, description,
    alternates:{canonical:`/${locale}${suffix}`,languages:{tr:`/tr${suffix}`,en:`/en${suffix}`,'x-default':`/en${suffix}`}},
    openGraph:{title:pageTitle,description,url:`/${locale}${suffix}`,locale:locale==='tr'?'tr_TR':'en_US',type:'website',images:[portfolioShareImage]},
    twitter:{card:'summary_large_image',title:pageTitle,description,images:[portfolioShareImage]},
  }
}
