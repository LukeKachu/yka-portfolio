import {compactReach, summarizeReach} from '@/lib/video/social'

export function PortfolioReach({projects, locale}: {projects:Record<string,unknown>[]; locale:'tr'|'en'}) {
  const stats = summarizeReach(projects)
  if (!stats.hasMetrics) return null
  const number = new Intl.NumberFormat(locale)
  const compact = compactReach(stats.total,locale)
  const date = (value:string) => new Intl.DateTimeFormat(locale,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`))
  return <aside className="portfolio-reach" aria-label={locale === 'tr' ? 'Çalışmaların görüntülenme özeti' : 'Portfolio views summary'}>
      <details><summary aria-label={`${compact.value}${compact.unit}${compact.plus ? '+' : ''} ${locale === 'tr' ? 'toplam görüntülenme — ölçüm detayları' : 'total views — measurement details'}`}><strong className="reach-number">{compact.value}{compact.unit}<span>{compact.plus ? '+' : ''}</span></strong><span className="reach-caption">{locale === 'tr' ? <>toplam<br/>görüntülenme</> : <>total<br/>views</>}</span><span className="reach-info" aria-hidden="true">ⓘ</span></summary>
        <div className="reach-disclosure">
        <dl><div><dt>{locale === 'tr' ? 'Kaydedilen toplam' : 'Recorded total'}</dt><dd>{number.format(stats.total)}</dd></div><div><dt>{locale === 'tr' ? 'Video izlenmesi' : 'Video views'}</dt><dd>{number.format(stats.videoViews)}</dd></div>{stats.postViews > 0n ? <div><dt>{locale === 'tr' ? 'X gönderi görüntülenmesi' : 'X post views'}</dt><dd>{number.format(stats.postViews)}</dd></div> : null}</dl>
        <p>{locale === 'tr' ? 'Yalnızca ölçümü bulunan yayınlar dahildir. Platform sayaçlarının toplamıdır; tekil kişi sayısı değildir. X gönderi görüntülenmesi, video oynatma sayısı değildir. Sayaçlar anlık güncellenmez.' : 'Includes publications with recorded measurements only. Platform totals are not unique viewers. X post views are not video plays. Counters are not live.'} {stats.dates.length ? `${locale === 'tr' ? 'Ölçüm' : 'Measured'}: ${date(stats.dates[0])}${stats.dates.at(-1) !== stats.dates[0] ? ` — ${date(stats.dates.at(-1)!)}` : ''}.` : null}</p>
        </div>
      </details>
  </aside>
}
