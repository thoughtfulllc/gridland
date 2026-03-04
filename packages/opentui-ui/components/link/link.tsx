import type { ReactNode } from "react"

export interface LinkProps {
  children: ReactNode
  url: string
}

export function Link({ children, url }: LinkProps) {
  return (
    <text>
      <a href={url}>{children}</a>
    </text>
  )
}
