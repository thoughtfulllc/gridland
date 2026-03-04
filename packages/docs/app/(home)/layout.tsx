import { HomeLayout } from "fumadocs-ui/layouts/home"
import type { ReactNode } from "react"

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      nav={{ title: "OpenTUI Web" }}
      links={[
        { text: "Docs", url: "/docs" },
        {
          text: "GitHub",
          url: "https://github.com/nicktomlin/opentui-web",
          external: true,
        },
      ]}
    >
      {children}
    </HomeLayout>
  )
}
