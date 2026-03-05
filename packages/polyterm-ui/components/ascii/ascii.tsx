export interface AsciiProps {
  text: string
  font?: "tiny" | "block" | "slick" | "shade"
  color?: string
}

export function Ascii({ text, font, color }: AsciiProps) {
  return <ascii-font text={text} font={font} style={{ fg: color }} />
}
