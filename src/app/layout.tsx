import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SignalFoundry - Tactical Operations Dashboard',
  description: 'AI-powered cybersecurity detection platform for tactical operations',
  keywords: 'cybersecurity, threat detection, security operations, AI, machine learning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white font-mono antialiased">
        {children}
      </body>
    </html>
  )
}
