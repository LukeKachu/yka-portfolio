'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {ArrowIcon} from './arrow-icon'

export function NotFoundContent() {
  const locale=usePathname()?.split('/')[1]==='en'?'en':'tr'
  return <main className="not-found-page" lang={locale}>
    <Link className="site-wordmark" href={`/${locale}`} aria-label="YKA — Yusuf Kerim Altay">YKA<span>.</span></Link>
    <p className="eyebrow">404 · {locale==='tr'?'Sayfa bulunamadı':'Page not found'}</p>
    <h1>{locale==='tr'?'Bu sayfa burada değil.':'This page isn’t here.'}</h1>
    <p>{locale==='tr'?'Bağlantı değişmiş veya sayfa kaldırılmış olabilir. Çalışmalarıma göz atabilir ya da doğrudan iletişime geçebilirsin.':'The link may have changed or the page may have been removed. Explore my work or get in touch.'}</p>
    <div className="hero-actions"><Link className="button-primary" href={`/${locale}/work`}>{locale==='tr'?'Çalışmaları gör':'Explore my work'}<ArrowIcon direction="up-right"/></Link><Link className="button-ghost" href={`/${locale}/contact`}>{locale==='tr'?'İletişim':'Contact'}<ArrowIcon direction="up-right"/></Link></div>
  </main>
}
