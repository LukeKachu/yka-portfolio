import {getPublicDataStatus} from '@/lib/data/public'

export async function EmptyState({children,locale}: {children: React.ReactNode;locale:'tr'|'en'}) {
  const status=await getPublicDataStatus()
  return <p className="empty-state">{status==='offline'?(locale==='tr'?'İçerikler bağlantı yeniden sağlandığında görünecek.':'Content will appear when the connection is restored.'):children}</p>
}
