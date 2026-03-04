// Browser shim for node:path
export function join(...parts: string[]): string {
  return parts.join("/").replace(/\/+/g, "/")
}
export function resolve(...parts: string[]): string {
  return join(...parts)
}
export function dirname(p: string): string {
  return p.split("/").slice(0, -1).join("/") || "/"
}
export function basename(p: string, ext?: string): string {
  const base = p.split("/").pop() || ""
  if (ext && base.endsWith(ext)) return base.slice(0, -ext.length)
  return base
}
export function extname(p: string): string {
  const base = basename(p)
  const idx = base.lastIndexOf(".")
  return idx >= 0 ? base.slice(idx) : ""
}
export const sep = "/"
export default { join, resolve, dirname, basename, extname, sep }
