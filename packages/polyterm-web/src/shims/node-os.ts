// Browser stub for node:os
export function homedir(): string { return "/home/user" }
export function tmpdir(): string { return "/tmp" }
export function platform(): string { return "browser" }
export function arch(): string { return "wasm" }
export default { homedir, tmpdir, platform, arch }
