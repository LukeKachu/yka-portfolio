export const locales = ['tr', 'en'] as const
export type Locale = (typeof locales)[number]

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

export const copy = {
  tr: {
    localeName: 'Türkçe',
    home: 'Ana Sayfa',
    work: 'Çalışmalar',
    resume: 'Özgeçmiş',
    about: 'Hakkımda',
    contact: 'İletişim',
    headline: 'Yusuf Kerim Altay',
    intro: '',
    downloadResume: 'Özgeçmişi İndir', selectedWork: 'Seçili Çalışmalar', selectedExperience: 'Seçili Deneyim', capabilities: 'Yetkinlikler',
    shortAbout: 'Hakkımda', contactCta: 'Birlikte çalışalım', noContent: 'Henüz yayınlanmış içerik yok.', viewProject: 'Projeyi Gör',
    watchYoutube: 'YouTube’da İzle', watchInstagram: 'Instagram’da İzle', watchTiktok: 'TikTok’ta İzle', visitWebsite: 'Web Sitesini Ziyaret Et', present: 'Günümüz',
  },
  en: {
    localeName: 'English',
    home: 'Home',
    work: 'Work',
    resume: 'Resume',
    about: 'About',
    contact: 'Contact',
    headline: 'Yusuf Kerim Altay',
    intro: '',
    downloadResume: 'Download Resume', selectedWork: 'Selected Work', selectedExperience: 'Selected Experience', capabilities: 'Capabilities',
    shortAbout: 'About', contactCta: 'Let’s work together', noContent: 'No published content yet.', viewProject: 'View Project',
    watchYoutube: 'Watch on YouTube', watchInstagram: 'Watch on Instagram', watchTiktok: 'Watch on TikTok', visitWebsite: 'Visit Website', present: 'Present',
  },
} satisfies Record<Locale, Record<string, string>>
