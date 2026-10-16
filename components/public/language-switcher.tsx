'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import type {Locale} from '@/app/[locale]/content'

export function LanguageSwitcher({locale}: {locale: Locale}) {
  const pathname = usePathname()
  const target = locale === 'en' ? 'tr' : 'en'
  const targetPath = pathname.replace(/^\/(en|tr)(?=\/|$)/, `/${target}`)
  return <Link href={targetPath || `/${target}`} hrefLang={target} aria-label={locale === 'tr' ? 'Switch to English' : 'Türkçeye geç'}>{target.toUpperCase()}</Link>
}
