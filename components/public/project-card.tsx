import Link from 'next/link'
import {MediaEmbed} from './media-embed'

export function ProjectCard({project, locale, index}: {project: Record<string,unknown>; locale: 'tr'|'en'; index: number}) {
  const title = String(project[`title_${locale}`] || project.internal_name)
  return <article className="portfolio-card">
    <MediaEmbed links={project.project_links as Record<string,unknown>[] || []} media={project.project_media as Record<string,unknown>[] || []} title={title} project={project} locale={locale}/>
    <div className="portfolio-card-copy"><span className="project-index">{String(index + 1).padStart(2,'0')}</span><div><p className="project-brand">{String((project.brands as Record<string,unknown> | null)?.name || 'YKA')}</p><h3><Link href={`/${locale}/work/${project.slug}`}>{title}</Link></h3></div><Link className="project-detail-link" href={`/${locale}/work/${project.slug}`} aria-label={`${title} — ${locale === 'tr' ? 'Detaylar' : 'Details'}`}>↗</Link></div>
  </article>
}
