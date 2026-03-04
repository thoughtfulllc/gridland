export type GradientName =
  | "cristal" | "teen" | "mind" | "morning" | "vice" | "passion"
  | "fruit" | "instagram" | "atlas" | "retro" | "summer" | "pastel" | "rainbow"

export interface GradientProps {
  children: string
  name?: GradientName
  colors?: string[]
}

interface RGB { r: number; g: number; b: number }

export const GRADIENTS: Record<GradientName, string[]> = {
  cristal: ["#bdfff3", "#4ac29a"],
  teen: ["#77a1d3", "#79cbca", "#e684ae"],
  mind: ["#473b7b", "#3584a7", "#30d2be"],
  morning: ["#ff5f6d", "#ffc371"],
  vice: ["#5ee7df", "#b490ca"],
  passion: ["#f43b47", "#453a94"],
  fruit: ["#ff4e50", "#f9d423"],
  instagram: ["#833ab4", "#fd1d1d", "#fcb045"],
  atlas: ["#feac5e", "#c779d0", "#4bc0c8"],
  retro: ["#3f51b1", "#5a55ae", "#7b5fac", "#8f6aae", "#a86aa4", "#cc6b8e", "#f18271", "#f3a469", "#f7c978"],
  summer: ["#fdbb2d", "#22c1c3"],
  rainbow: ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff", "#ff0000"],
  pastel: ["#74ebd5", "#ACB6E5"],
}

export function hexToRgb(hex: string): RGB {
  const normalized = hex.replace("#", "")
  return {
    r: parseInt(normalized.substring(0, 2), 16),
    g: parseInt(normalized.substring(2, 4), 16),
    b: parseInt(normalized.substring(4, 6), 16),
  }
}

export function rgbToHex(rgb: RGB): string {
  const r = rgb.r.toString(16).padStart(2, "0")
  const g = rgb.g.toString(16).padStart(2, "0")
  const b = rgb.b.toString(16).padStart(2, "0")
  return `#${r}${g}${b}`
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function interpolateColor(color1: RGB, color2: RGB, t: number): RGB {
  return {
    r: Math.round(lerp(color1.r, color2.r, t)),
    g: Math.round(lerp(color1.g, color2.g, t)),
    b: Math.round(lerp(color1.b, color2.b, t)),
  }
}

export function generateGradient(colors: string[], steps: number): string[] {
  if (colors.length === 0) throw new Error("At least one color is required")
  if (colors.length === 1 || steps <= 1) return Array(steps).fill(colors[0])

  const rgbColors = colors.map(hexToRgb)
  const result: string[] = []
  const segmentLength = (steps - 1) / (rgbColors.length - 1)

  for (let i = 0; i < steps; i++) {
    const segmentIndex = Math.min(Math.floor(i / segmentLength), rgbColors.length - 2)
    const segmentProgress = segmentLength > 0 ? (i - segmentIndex * segmentLength) / segmentLength : 0
    const color = interpolateColor(rgbColors[segmentIndex], rgbColors[segmentIndex + 1], Math.min(segmentProgress, 1))
    result.push(rgbToHex(color))
  }
  return result
}

export function Gradient({ children, name, colors }: GradientProps) {
  if (name && colors) throw new Error("The `name` and `colors` props are mutually exclusive")
  if (!name && !colors) throw new Error("Either `name` or `colors` prop must be provided")

  const gradientColors = name ? GRADIENTS[name] : colors!
  const lines = children.split("\n")
  const maxLength = Math.max(...lines.map((l) => l.length))

  if (maxLength === 0) return <text>{children}</text>

  const hexColors = generateGradient(gradientColors, maxLength)

  return (
    <>
      {lines.map((line, lineIndex) => (
        <text key={lineIndex}>
          {line.split("").map((char, charIndex) => (
            <span key={charIndex} style={{ fg: hexColors[charIndex] }}>
              {char}
            </span>
          ))}
        </text>
      ))}
    </>
  )
}
