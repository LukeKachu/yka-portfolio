type Draft={name:string;email:string;phone:string;reason:string;message:string}

// A real mail-client draft, not a claim of server delivery. No network/storage side effect.
export function contactMailto(recipient:string,draft:Draft,locale:'tr'|'en') {
  const tr=locale==='tr'
  const topics:Record<string,string>=tr?{project:'Proje / iş birliği',opportunity:'İş fırsatı',other:'Tanışma / diğer'}:{project:'Project / collaboration',opportunity:'Job opportunity',other:'Introduction / other'}
  const topic=topics[draft.reason]||topics.other
  const body=[`${tr?'Ad soyad':'Name'}: ${draft.name}`,`Email: ${draft.email}`,`${tr?'Telefon':'Phone'}: ${draft.phone}`,`${tr?'Konu':'Topic'}: ${topic}`,'',draft.message].join('\r\n')
  return `mailto:${recipient}?subject=${encodeURIComponent(`YKA | ${topic}`)}&body=${encodeURIComponent(body)}`
}
