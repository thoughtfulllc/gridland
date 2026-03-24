import type { ReactNode } from "react"

export const viewport = {
  themeColor: "#1a1a2e",
  viewportFit: "cover" as const,
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`body { background-color: #1a1a2e; }`}</style>
      <div style={{ backgroundColor: "#1a1a2e", minHeight: "100vh" }}>{children}</div>
    </>
  )
}
