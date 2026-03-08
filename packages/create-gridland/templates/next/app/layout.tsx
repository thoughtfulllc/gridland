import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gridland App",
  description: "A Gridland project powered by Next.js",
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
