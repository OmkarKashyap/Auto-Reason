import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Personal Thought Graph",
  description: "Visualize your ideas as a dynamic knowledge graph",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-documenso-dark text-white h-screen overflow-hidden`}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}