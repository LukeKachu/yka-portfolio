import {notFound} from 'next/navigation'
import {copy,isLocale} from '../content'
import {getAbout,getEducation,getExperiences,getLanguages,getSkillGroups,getSettings,getVolunteering,publicAssetUrl} from '@/lib/data/public'
import {EmptyState} from '@/components/public/empty-state'

const institutionNames:Record<string,{tr:string;en:string}>={'Pamukkale University':{tr:'Pamukkale Üniversitesi',en:'Pamukkale University'},'Yalova Çiftlikköy Atatürk Anatolian High School':{tr:'Yalova Çiftlikköy Atatürk Anadolu Lisesi',en:'Yalova Çiftlikköy Atatürk Anatolian High School'}}
const organizationNames:Record<string,{tr:string;en:string}>={'Pamukkale University Business Committee':{tr:'Pamukkale Üniversitesi İşletme Kulübü',en:'Pamukkale University Business Committee'},'Pamukkale Üniversitesi İşletme Kulübü':{tr:'Pamukkale Üniversitesi İşletme Kulübü',en:'Pamukkale University Business Committee'}}

export default async function ResumePage({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;if(!isLocale(locale))notFound()
  const [experience,education,volunteering,skillGroups,languages,settings,about]=await Promise.all([getExperiences(),getEducation(),getVolunteering(),getSkillGroups(),getLanguages(),getSettings(),getAbout()])
  const resumeUrl=publicAssetUrl('resume-public',settings?.resume_pdf_path)||'/cv/Yusuf-Kerim-Altay-Social-Media-CV.pdf'
  const date=(value:unknown)=>value?new Intl.DateTimeFormat(locale,{month:'short',year:'numeric'}).format(new Date(String(value))):''
  const dateRange=(start:unknown,end:unknown,current=false)=>[date(start),current?copy[locale].present:date(end)].filter(Boolean).join(' — ')
  const aboutCopy=String(about?.[`content_${locale}`]||'')
  return <main>
    <div className="page-heading resume-hero"><div><p className="eyebrow">YKA · Yusuf Kerim Altay</p><h1>{copy[locale].resume}</h1></div><a className="resume-download" href={resumeUrl} target="_blank" rel="noreferrer">{copy[locale].downloadResume}<span>↓</span></a></div>
    <details className="resume-document"><summary><span>{locale==='tr'?'Orijinal CV dosyamı görüntüle':'View my original CV'}</span><span aria-hidden="true">＋</span></summary><iframe src={resumeUrl} title={locale==='tr'?'Yusuf Kerim Altay — CV dosyası':'Yusuf Kerim Altay — CV document'} loading="lazy"/><p><a className="section-link" href={resumeUrl} target="_blank" rel="noreferrer">{locale==='tr'?'PDF’yi yeni sekmede aç':'Open PDF in a new tab'} ↗</a></p></details>
    {aboutCopy?<section className="resume-about"><p className="eyebrow">{locale==='tr'?'Hakkımda':'About'}</p><p>{aboutCopy}</p></section>:null}
    <section className="resume-section" id="experience"><h2>{locale==='tr'?'Deneyim':'Experience'}</h2>{experience.length?experience.map(item=><article className="resume-item" key={String(item.id)}><div><h3>{String(item[`job_title_${locale}`]||'')}</h3><p className="resume-item-company">{item.company_url?<a href={String(item.company_url)} target="_blank" rel="noreferrer">{String(item.company)} ↗</a>:<span className="company-name">{String(item.company)}</span>}</p></div><time>{dateRange(item.start_date,item.end_date,Boolean(item.current_position))}</time><ul>{((item[`bullets_${locale}`] as string[])||[]).map(bullet=><li key={bullet}>{bullet}</li>)}</ul></article>):<EmptyState locale={locale}>{copy[locale].noContent}</EmptyState>}</section>
    <section className="resume-columns">
      <div className="resume-card education-card"><h2>{locale==='tr'?'Eğitim':'Education'}</h2>{education.map(item=>{const institution=institutionNames[String(item.institution)]?.[locale]||String(item.institution);return <div className="resume-card-item education-item" key={String(item.id)}><strong>{institution}</strong>{(item[`program_${locale}`]||item.program)?<span>{String(item[`program_${locale}`]||item.program)}</span>:null}<small>{[item.start_date?String(item.start_date).slice(0,4):'',item.end_date?String(item.end_date).slice(0,4):''].filter(Boolean).join(' — ')}</small></div>})}</div>
      <div className="resume-card"><h2>{locale==='tr'?'Diller':'Languages'}</h2><div className="language-list">{languages.map(language=><div className="language-row" key={String(language.id)}><strong>{String(language[`name_${locale}`]||'')}</strong><span>{String(language[`proficiency_${locale}`]||'')}</span></div>)}</div></div>
      <div className="resume-card volunteering-card"><h2>{locale==='tr'?'Gönüllülük':'Volunteering'}</h2>{volunteering.map(item=><div className="resume-card-item volunteering-item" key={String(item.id)}><strong>{organizationNames[String(item.organization)]?.[locale]||String(item.organization)}</strong><div className="resume-card-meta"><span>{String(item[`role_${locale}`]||'')}</span><small>{dateRange(item.start_date,item.end_date)}</small></div><ul>{((item[`bullets_${locale}`] as string[])||[]).map(bullet=><li key={bullet}>{bullet}</li>)}</ul></div>)}</div>
      <div className="resume-card skills-card"><h2>{copy[locale].capabilities}</h2>{skillGroups.map(group=><div className="resume-card-item" key={String(group.id)}><strong>{String(group[`title_${locale}`]||'')}</strong><div className="skill-list">{((group.skills as Array<Record<string,unknown>>)||[]).map((skill,index)=><span key={String(skill.id)}><b>{String(index+1).padStart(2,'0')}</b>{String(skill[`name_${locale}`]||skill.name)}</span>)}</div></div>)}</div>
    </section>
  </main>
}
