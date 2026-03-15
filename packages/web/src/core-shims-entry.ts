// Entry point for the compiled core-shims bundle (dist/core-shims.js).
// This is a browser-compatible version of @gridland/core — it re-exports
// everything from @opentui/core (with native modules shimmed) and
// @opentui/react (reconciler internals included). The Vite and Next.js
// plugins alias @gridland/core to this bundle in npm mode.
export * from "@opentui/core"
export * from "@opentui/react"
