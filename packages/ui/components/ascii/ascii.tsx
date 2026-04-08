import { useTheme } from "../theme/index"

export interface AsciiProps {
  /** The text string to render as ASCII art. */
  text: string
  /** Font variant for the ASCII rendering. Available fonts: tiny, block, slick, shade. Defaults to "tiny". */
  font?: "tiny" | "block" | "slick" | "shade"
  /** Override the text color. Defaults to theme.primary. */
  color?: string
}

/** Renders text as ASCII art using the specified font and color. */
export function Ascii({ text, font, color }: AsciiProps) {
  const theme = useTheme()
  const resolvedColor = color ?? theme.primary
  return <ascii-font text={text} font={font} style={{ fg: resolvedColor }} />
}
