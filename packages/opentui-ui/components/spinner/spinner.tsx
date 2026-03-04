import { useEffect, useState } from "react"

export interface SpinnerProps {
  text?: string
  color?: string
  interval?: number
}

const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

export function Spinner({ text = "Loading", color = "gray", interval = 100 }: SpinnerProps) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length)
    }, interval)
    return () => clearInterval(timer)
  }, [interval])

  return (
    <text style={{ fg: color }}>
      {frames[frame]} {text}
    </text>
  )
}
