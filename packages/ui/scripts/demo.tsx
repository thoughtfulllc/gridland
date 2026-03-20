// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { demos } from "../../../demos/index"
import { runDemo } from "../../demo/src/run"

const name = process.argv[2]

if (!name) {
  console.log("Available demos:")
  for (const d of demos) {
    console.log(`  ${d.name}`)
  }
  console.log(`\nUsage: bun run demo <name>`)
  process.exit(0)
}

await runDemo(name)
