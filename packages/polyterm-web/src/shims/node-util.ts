// Browser stub for node:util
export function inspect(obj: any, _options?: any): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

export function format(fmt: string, ...args: any[]): string {
  let i = 0
  return fmt.replace(/%[sdjifoO%]/g, (match) => {
    if (match === "%%") return "%"
    if (i >= args.length) return match
    return String(args[i++])
  })
}

export function promisify(fn: Function): Function {
  return (...args: any[]) =>
    new Promise((resolve, reject) => {
      fn(...args, (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
}

export function isDeepStrictEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export default { inspect, format, promisify, isDeepStrictEqual }
