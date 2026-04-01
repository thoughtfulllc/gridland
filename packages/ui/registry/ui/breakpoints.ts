import { useTerminalDimensions } from "@gridland/utils"

export interface Breakpoints {
  /** Width < 40 columns */
  isTiny: boolean
  /** Width < 60 columns */
  isNarrow: boolean
  /** Width < 70 columns */
  isMobile: boolean
  /** Width >= 70 columns */
  isDesktop: boolean
  /** Terminal width in columns */
  width: number
  /** Terminal height in rows */
  height: number
}

export const BREAKPOINTS = {
  tiny: 40,
  narrow: 60,
  mobile: 70,
} as const

/** Returns responsive breakpoint flags based on current terminal dimensions. */
export function useBreakpoints(): Breakpoints {
  const { width, height } = useTerminalDimensions()

  return {
    isTiny: width < BREAKPOINTS.tiny,
    isNarrow: width < BREAKPOINTS.narrow,
    isMobile: width < BREAKPOINTS.mobile,
    isDesktop: width >= BREAKPOINTS.mobile,
    width,
    height,
  }
}
