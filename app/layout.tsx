import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '品牌合作邮件管理工具',
  description: '帮助自媒体博主整理和回复品牌方的合作邮件',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
