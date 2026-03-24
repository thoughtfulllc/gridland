import { RootProvider } from "fumadocs-ui/provider"
import Script from "next/script"
import type { ReactNode } from "react"
import "./global.css"

export const metadata = {
  title: {
    template: "%s | Gridland",
    default: "Gridland",
  },
  description: "A framework for building terminal apps, built on OpenTUI + React.",
  alternates: {
    types: {
      "text/plain": "/tui.txt",
    },
  },
}

export const viewport = {
  themeColor: "#1a1a2e",
  viewportFit: "cover" as const,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ backgroundColor: "#1a1a2e" }}>
        <RootProvider>{children}</RootProvider>
        {process.env.UMAMI_WEBSITE_ID && (
          <Script
            defer
            src="https://cloud.umami.is/script.js"
            data-website-id={process.env.UMAMI_WEBSITE_ID}
          />
        )}
      </body>
    </html>
  )
}
