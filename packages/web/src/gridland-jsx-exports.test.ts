import { describe, it, expect } from "bun:test"
import fs from "node:fs"
import path from "node:path"

const pkgJsonPath = path.resolve(import.meta.dir, "../package.json")
const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"))

describe("gridland-jsx.d.ts package exports", () => {
  it("exports ./jsx with types condition", () => {
    expect(pkgJson.exports["./jsx"]).toBeDefined()
    expect(pkgJson.exports["./jsx"].types).toBe("./src/gridland-jsx.d.ts")
  })

  it("files array includes the .d.ts", () => {
    expect(pkgJson.files).toContain("src/gridland-jsx.d.ts")
  })

  it("the declared file exists on disk", () => {
    const dtsPath = path.resolve(import.meta.dir, "gridland-jsx.d.ts")
    expect(fs.existsSync(dtsPath)).toBe(true)
  })
})
