import { HomeLayout } from "fumadocs-ui/layouts/home"
import type { ReactNode } from "react"

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      nav={{ title: "Polyterm" }}
      links={[
        { text: "Docs", url: "/docs" },
        {
          text: "GitHub",
          url: "https://github.com/cjroth/polyterm",
          external: true,
        },
      ]}
    >
      {children}
    </HomeLayout>
  )
}
