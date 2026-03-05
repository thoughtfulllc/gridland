import { RootProvider } from "fumadocs-ui/provider"
import type { ReactNode } from "react"
import "./global.css"

export const metadata = {
  title: {
    template: "%s | Polyterm",
    default: "Polyterm",
  },
  description: "Render terminal UIs to HTML5 Canvas with React",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
