'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useEffect,useRef,useState} from 'react'
import {LanguageSwitcher} from './language-switcher'
import {ThemeToggle} from './theme-toggle'

export function PublicNavigation({locale}:{locale:'tr'|'en'}) {
  const [open,setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const tr = locale === 'tr'
  useEffect(() => {
    if (!open) return
    function closeOutside(event:PointerEvent) {if (event.target instanceof Node && !wrapper.current?.contains(event.target)) setOpen(false)}
    function closeEscape(event:KeyboardEvent) {if (event.key === 'Escape') {setOpen(false); trigger.current?.focus()}}
    document.addEventListener('pointerdown',closeOutside)
    document.addEventListener('keydown',closeEscape)
    return () => {document.removeEventListener('pointerdown',closeOutside); document.removeEventListener('keydown',closeEscape)}
  },[open])
  return <div ref={wrapper} className="public-navigation">
    <button ref={trigger} className="mobile-menu-toggle" type="button" aria-expanded={open} aria-controls="public-nav" onClick={() => setOpen(!open)}>{open ? (tr ? 'Kapat' : 'Close') : (tr ? 'Menü' : 'Menu')}<span aria-hidden="true">{open ? '−' : '+'}</span></button>
    <nav id="public-nav" className={`site-nav ${open ? 'site-nav-open' : ''}`} aria-label={tr ? 'Ana menü' : 'Main navigation'} onClick={event => {if (event.target instanceof Element && event.target.closest('a')) setOpen(false)}}>
      {[['work',tr ? 'Çalışmalar' : 'Work'],['resume',tr ? 'Özgeçmiş' : 'Resume'],['contact',tr ? 'İletişim' : 'Contact']].map(([path,label]) => <Link key={path} href={`/${locale}/${path}`} aria-current={pathname === `/${locale}/${path}` || pathname.startsWith(`/${locale}/${path}/`) ? 'page' : undefined}>{label}</Link>)}
      <div className="site-nav-tools"><LanguageSwitcher locale={locale}/><ThemeToggle locale={locale}/></div>
    </nav>
  </div>
}
