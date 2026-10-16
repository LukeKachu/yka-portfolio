import {ArrowIcon} from '@/components/public/arrow-icon'
import {notFound} from 'next/navigation'
import {copy,isLocale} from '../content'
import {getProjects} from '@/lib/data/public'
import {EmptyState} from '@/components/public/empty-state'
import {ProjectCard} from '@/components/public/project-card'
import {PortfolioReach} from '@/components/public/portfolio-reach'
import {isVideoProject} from '@/lib/video/social'
import {localizedPageMetadata} from '@/lib/seo/metadata'

export async function generateMetadata({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params
  if (!isLocale(locale)) return {}
  return localizedPageMetadata(locale,'work',copy[locale].work,locale==='tr'?'Sosyal medya, video ve dijital deneyimlerden seçili üretimler.':'Selected social, video and digital work.')
}

export default async function WorkPage({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;if(!isLocale(locale))notFound()
  const projects=await getProjects()
  const videos=projects.filter(isVideoProject)
  const websites=projects.filter(project=>((project.project_links as Array<Record<string,unknown>>)||[]).some(link=>String(link.platform)==='website'))
  return <main>
    <div className="work-intro"><div className="page-heading work-heading">{locale==='en'?<p className="eyebrow">Selected work · 2021—2026</p>:null}<h1>{copy[locale].work}</h1><p>{locale==='tr'?'Sosyal medya, video ve dijital deneyimlerden seçili üretimler.':'Selected social, video and digital work.'}</p></div><PortfolioReach projects={projects} locale={locale}/></div>
    {videos.length?<section className="work-section"><div className="work-section-title"><span>01</span><h2>{locale==='tr'?'Video ve Sosyal Medya':'Video & Social'}</h2></div><div className="portfolio-grid">{videos.map((project,index)=><ProjectCard project={project} locale={locale} index={index} key={String(project.id)}/>)}</div></section>:!websites.length?<EmptyState locale={locale}>{copy[locale].noContent}</EmptyState>:null}
    {websites.length?<section className="work-section"><div className="work-section-title"><span>02</span><h2>{locale==='tr'?'Web Siteleri':'Websites'}</h2></div><div className="website-grid">{websites.map(project=>{const name=String(project[`title_${locale}`]||project.internal_name);const url=String(((project.project_links as Array<Record<string,unknown>>)||[]).find(link=>link.platform==='website')?.url||'');return <a className="website-card" href={url} target="_blank" rel="noreferrer" key={String(project.id)}><span>{String((project.brands as Record<string,unknown>|null)?.name||'')}</span><h3>{name}</h3><p>{url.replace(/^https?:\/\//,'')}</p><b><ArrowIcon direction="up-right"/></b></a>})}</div></section>:null}
  </main>
}
