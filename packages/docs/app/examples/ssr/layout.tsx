import type { ReactNode } from "react"

export default function SSRLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
