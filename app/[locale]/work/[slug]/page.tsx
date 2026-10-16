import Link from 'next/link'
import {notFound} from 'next/navigation'
import {copy, isLocale} from '../../content'
import {getProjectBySlug} from '@/lib/data/public'
import {MediaEmbed} from '@/components/public/media-embed'

export default async function ProjectPage({params}: {params: Promise<{locale: string; slug: string}>}) {
  const {locale, slug} = await params
  if (!isLocale(locale)) notFound()
  const project = await getProjectBySlug(slug)
  if (!project) notFound()
  const text = copy[locale]
  const roles = (project.project_roles as Array<Record<string, unknown>> || [])
  const links = (project.project_links as Array<Record<string, unknown>> || [])
  const linkLabels: Record<string, string> = {youtube: text.watchYoutube, instagram: text.watchInstagram, tiktok: text.watchTiktok, website: text.visitWebsite, other: locale === 'tr' ? 'Bağlantıyı Aç ↗' : 'Open Link ↗'}
  return <article className="project-detail"><Link className="back-link" href={`/${locale}/work`}>← {text.work}</Link><header><p className="eyebrow">{String((project.brands as Record<string,unknown> | null)?.name || '')}</p><h1>{String(project[`title_${locale}`] || project.internal_name)}</h1><p>{String(project[`short_description_${locale}`] || '')}</p></header><div className="project-detail-media"><MediaEmbed links={links} media={project.project_media as Record<string,unknown>[] || []} title={String(project[`title_${locale}`] || project.internal_name)} project={project} locale={locale}/></div><div className="project-body"><div><p>{String(project[`description_${locale}`] || '')}</p></div><aside>{project.project_date ? <p>{String(project.project_date).slice(0,4)}</p> : null}{roles.length ? <ul>{roles.map((role) => <li key={String(role.id)}>{String(role[`role_${locale}`] || '')}</li>)}</ul> : null}</aside></div>{links.length ? <div className="project-links">{links.map((link) => <a href={String(link.url)} key={String(link.id)} target="_blank" rel="noreferrer">{linkLabels[String(link.platform)]}</a>)}</div> : null}</article>
}
