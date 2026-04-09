// Browser-safe stub for devtools-polyfill.ts and react-devtools-core.
// The original devtools-polyfill uses top-level await to import `ws` for Node.js.
// In the browser, WebSocket is natively available, so we skip the import.
//
// This file is also aliased as the `react-devtools-core` package (see vite-plugin.ts),
// so it needs a default export with no-op methods matching the devtools API.
export default { initialize() {}, connectToDevTools() {} }
