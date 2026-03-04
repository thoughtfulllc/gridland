// Browser stub for node:fs and fs/promises
export function existsSync(_path: string): boolean { return false }
export function readFileSync(_path: string, _encoding?: string): string { return "" }
export function writeFileSync(): void {}
export function mkdirSync(): void {}
export function readdirSync(): string[] { return [] }
export function statSync(): any { return { isDirectory: () => false, isFile: () => false } }
export function unlinkSync(): void {}

// fs/promises
export async function readFile(): Promise<string> { return "" }
export async function writeFile(): Promise<void> {}
export async function mkdir(): Promise<void> {}
export async function readdir(): Promise<string[]> { return [] }
export async function stat(): Promise<any> { return { isDirectory: () => false, isFile: () => false } }

export default {
  existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync,
  promises: { readFile, writeFile, mkdir, readdir, stat },
}
