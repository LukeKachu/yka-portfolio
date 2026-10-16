import type {Metadata} from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Yusuf Kerim Altay — Portfolio',
  description: 'Personal portfolio and resume',
}

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="tr" data-theme="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
