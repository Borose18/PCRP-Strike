import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PCRP Strike System',
  description: 'Pacific Coast RP — Staff violation tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
