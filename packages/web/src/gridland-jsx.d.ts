// JSX intrinsic elements for Gridland (built on the opentui engine)
// These map to the component catalogue in the reconciler

import type { RGBA } from "./core-shims/rgba"

type ColorInput = string | RGBA

declare global {
  namespace JSX {
    interface IntrinsicElements {
      box: {
        id?: string
        width?: number | string
        height?: number | string
        flexDirection?: "row" | "column" | "row-reverse" | "column-reverse"
        flexGrow?: number
        flexShrink?: number
        flexWrap?: "no-wrap" | "wrap" | "wrap-reverse"
        alignItems?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | "baseline"
        justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly"
        alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | "baseline"
        padding?: number | string
        paddingX?: number | string
        paddingY?: number | string
        paddingTop?: number | string
        paddingRight?: number | string
        paddingBottom?: number | string
        paddingLeft?: number | string
        margin?: number | string
        marginX?: number | string
        marginY?: number | string
        marginTop?: number | string
        marginRight?: number | string
        marginBottom?: number | string
        marginLeft?: number | string
        border?: boolean | string[]
        borderStyle?: "single" | "double" | "rounded" | "heavy"
        borderColor?: ColorInput
        backgroundColor?: ColorInput
        shouldFill?: boolean
        title?: string
        titleAlignment?: "left" | "center" | "right"
        visible?: boolean
        opacity?: number
        gap?: number | string
        rowGap?: number | string
        columnGap?: number | string
        position?: "relative" | "absolute"
        top?: number | string
        right?: number | string
        bottom?: number | string
        left?: number | string
        minWidth?: number | string
        minHeight?: number | string
        maxWidth?: number | string
        maxHeight?: number | string
        zIndex?: number
        overflow?: "visible" | "hidden" | "scroll"
        style?: Record<string, any>
        children?: React.ReactNode
        [key: string]: any
      }
      text: {
        id?: string
        fg?: ColorInput
        bg?: ColorInput
        attributes?: number
        content?: any
        wrapMode?: "none" | "char" | "word"
        textAlign?: "left" | "center" | "right"
        truncate?: boolean
        style?: Record<string, any>
        children?: React.ReactNode
        [key: string]: any
      }
      span: {
        fg?: ColorInput
        bg?: ColorInput
        attributes?: number
        style?: Record<string, any>
        children?: React.ReactNode
        [key: string]: any
      }
      b: { children?: React.ReactNode; [key: string]: any }
      strong: { children?: React.ReactNode; [key: string]: any }
      i: { children?: React.ReactNode; [key: string]: any }
      em: { children?: React.ReactNode; [key: string]: any }
      u: { children?: React.ReactNode; [key: string]: any }
      br: { [key: string]: any }
      a: { href: string; children?: React.ReactNode; [key: string]: any }
      scrollbox: { [key: string]: any }
      input: { [key: string]: any }
      select: { [key: string]: any }
      "ascii-font": { [key: string]: any }
    }
  }
}

export {}
