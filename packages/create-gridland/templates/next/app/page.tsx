"use client"

import dynamic from "next/dynamic"

// Dynamic import with SSR disabled — @gridland/utils uses top-level await
// (Yoga WASM) which is not supported during Next.js server-side rendering.
const GridlandApp = dynamic(() => import("./gridland-app"), { ssr: false })

export default function Home() {
  return <GridlandApp />
}
