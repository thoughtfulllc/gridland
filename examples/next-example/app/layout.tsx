import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "OpenTUI Web — Next.js Example",
  description: "OpenTUI rendered to HTML5 Canvas in a Next.js app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: "#1e2029" }}>{children}</body>
    </html>
  )
}
