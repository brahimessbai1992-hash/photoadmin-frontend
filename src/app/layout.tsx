import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PhotoAdmin — منصة البطاقات الإدارية',
  description: 'أتمتة الصور البيومترية وبطاقات CIN، جواز السفر، CNSS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
