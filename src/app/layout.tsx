import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SignalFoundry - Cyber Risk Quantification Dashboard',
  description: 'AI-powered cybersecurity Risk Quantification Platform',
  keywords: 'cybersecurity, Cyber Metrics, security operations, AI, machine learning',
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
