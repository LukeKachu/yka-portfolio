import {notFound} from 'next/navigation'
import {copy, isLocale} from './content'
import Link from 'next/link'
import {EmptyState} from '@/components/public/empty-state'
import {getAbout, getExperiences, getProjects, getSettings, getSkillGroups} from '@/lib/data/public'
import {ProjectCard} from '@/components/public/project-card'
import {PortfolioReach} from '@/components/public/portfolio-reach'

export default async function LocalizedHome({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  if (!isLocale(locale)) notFound()
  const text = copy[locale]
  const [settings, allProjects, experiences, about, skillGroups] = await Promise.all([getSettings(), getProjects(), getExperiences(), getAbout(), getSkillGroups()])
  const featured = allProjects.filter((project) => project.featured)
  const projects = featured.length ? featured : allProjects
  const title = String(settings?.[`professional_title_${locale}`] || (locale === 'en' ? 'Social Media Content Creator & Digital Marketing Specialist' : 'Sosyal Medya İçerik Üreticisi ve Dijital Pazarlama Uzmanı'))
  const introduction = String(settings?.[`hero_introduction_${locale}`] || '')
  return (
    <main>
      <section className="hero"><div className="hero-copy"><p className="eyebrow"><span className="status-dot"/> İstanbul, Türkiye</p><h1>{String(settings?.full_name || text.headline)}</h1><p className="hero-title">{title}</p>{introduction ? <p className="hero-intro">{introduction}</p> : null}<div className="hero-actions"><Link className="button-primary" href={`/${locale}/work`}>{locale === 'tr' ? 'Çalışmalarımı keşfet' : 'Explore my work'}<span>↗</span></Link><Link className="button-ghost" href={`/${locale}/contact`}>{text.contact}<span>↗</span></Link></div></div><div className="hero-signature" aria-hidden="true"><span className="signature-label">{locale === 'tr' ? 'Fikirden son kareye.' : 'From idea to final frame.'}</span><span className="signature-mark">YKA<span>.</span></span><div className="signature-bottom"><span>{locale === 'tr' ? 'İçerik / Strateji / Dijital' : 'Content / Strategy / Digital'}</span><span>↘</span></div></div><div className="hero-colophon"><span>{locale === 'tr' ? 'Bağımsız bakış. Markaya özgü üretim.' : 'Independent thinking. Brand-specific work.'}</span><a href="#selected-work">{locale === 'tr' ? 'Seçili çalışmalar' : 'Selected work'} ↓</a></div></section>
      <section className="editorial-section" id="selected-work"><div className="section-heading"><div><p className="eyebrow">01 · {locale === 'tr' ? 'Portfolyo' : 'Portfolio'}</p><h2>{text.selectedWork}</h2></div><div className="section-heading-actions"><PortfolioReach projects={allProjects} locale={locale}/><Link className="section-link" href={`/${locale}/work`}>{locale === 'tr' ? 'Tümünü gör' : 'View all'} ↗</Link></div></div>{projects.length ? <div className="portfolio-grid">{projects.slice(0,3).map((project, index) => <ProjectCard project={project} locale={locale} index={index} key={String(project.id)}/>)}</div> : <EmptyState locale={locale}>{text.noContent}</EmptyState>}</section>
      <section className="editorial-section experience-showcase"><div className="section-heading"><div><p className="eyebrow">02 · {locale === 'tr' ? 'Deneyim' : 'Experience'}</p><h2>{text.selectedExperience}</h2></div><Link className="section-link" href={`/${locale}/resume#experience`}>{text.resume} ↗</Link></div>{experiences.length ? <ol className="experience-list">{experiences.slice(0,4).map((item,index) => <li key={String(item.id)}><Link href={`/${locale}/resume#experience`}><span className="experience-index">0{index+1}</span><strong>{String(item.company)}</strong><span>{String(item[`job_title_${locale}`] || '')}</span><span className="experience-arrow">↗</span></Link></li>)}</ol> : <EmptyState locale={locale}>{text.noContent}</EmptyState>}</section>
      <section className="editorial-split"><div><p className="eyebrow">03 · {text.capabilities}</p><div className="capability-cloud">{skillGroups.flatMap((group) => ((group.skills as Array<Record<string,unknown>>) || []).map((skill)=><span key={String(skill.id)}>{String(skill[`name_${locale}`] || skill.name)}</span>))}</div></div><div><p className="eyebrow">04 · {text.shortAbout}</p>{about?.[`content_${locale}`] ? <p className="about-lead">{String(about[`content_${locale}`])}</p> : <EmptyState locale={locale}>{text.noContent}</EmptyState>}<Link className="section-link" href={`/${locale}/resume`}>{locale==='tr'?'Hikâyemin devamı':'More about me'} ↗</Link></div></section>
      <section className="contact-cta"><p>{text.contactCta}</p><Link href={`/${locale}/contact`}>{text.contact} →</Link></section>
    </main>
  )
}
