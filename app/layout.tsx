import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Memekipedia',
  description: 'A Web3-powered wiki platform for the community, by the community.',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="">
        <Providers>
          <div className="flex min-h-screen flex-col bg-[#0f172a] text-slate-100">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
