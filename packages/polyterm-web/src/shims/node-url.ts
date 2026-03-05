// Browser stub for node:url
export function fileURLToPath(url: string): string {
  return url.replace("file://", "")
}
export function pathToFileURL(path: string): URL {
  return new URL(`file://${path}`)
}
export default { fileURLToPath, pathToFileURL }
