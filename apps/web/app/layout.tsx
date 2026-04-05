import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vibe Coding Template',
  description: 'Military-grade reliability patterns for AI-assisted frontend development',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
        {children}
      </body>
    </html>
  )
}
