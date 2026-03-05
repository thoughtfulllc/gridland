import { defineConfig } from "tsup"

export default defineConfig({
  entry: { index: "components/index.ts" },
  format: ["esm"],
  // DTS generation is skipped because opentui custom elements (text, span,
  // select) conflict with React's HTML/SVG intrinsic element types during
  // type checking. The style prop (e.g. { fg: "red" }) is valid at runtime
  // but TypeScript sees it as CSSProperties from the SVG text element.
  // Since this is a private workspace package consumed via source, DTS
  // isn't needed — consumers get types directly from the .tsx source files.
  dts: false,
  sourcemap: true,
  external: ["react", "react-dom", "@opentui/core", "@opentui/react"],
  target: "esnext",
})
