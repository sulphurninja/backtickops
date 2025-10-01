import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Backtick Ops — Timebox',
  description: 'Daily Timebox planner for Backtick Labs'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('bt_theme') || 'dark';
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        {children}
      </body>
    </html>
  )
}
