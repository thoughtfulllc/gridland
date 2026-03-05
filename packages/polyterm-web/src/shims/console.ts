// Shim for node:console - just re-export the global console
export const Console = globalThis.console.constructor
export default globalThis.console
