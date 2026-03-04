// Quick browser verification using Playwright
// Launches Chromium, loads the app, checks canvas has content, takes a screenshot
import { chromium } from "playwright"

async function verify() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } })

  // Collect console messages
  const logs = []
  const errors = []
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text())
    else logs.push(`[${msg.type()}] ${msg.text()}`)
  })
  page.on("pageerror", (err) => {
    errors.push(`PAGE ERROR: ${err.message}\n${err.stack}`)
    console.error(`PAGE ERROR: ${err.message}\n${err.stack}`)
  })

  console.log("Navigating to http://localhost:5173/ ...")
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" })

  // Wait a bit for the render loop to run
  await page.waitForTimeout(2000)

  // Check canvas exists and has non-zero dimensions
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.getElementById("terminal-canvas")
    if (!canvas) return { exists: false }
    return {
      exists: true,
      width: canvas.width,
      height: canvas.height,
      styleWidth: canvas.style.width,
      styleHeight: canvas.style.height,
    }
  })

  console.log("Canvas info:", canvasInfo)

  if (!canvasInfo.exists) {
    console.error("FAIL: Canvas element not found")
    await browser.close()
    process.exit(1)
  }

  if (canvasInfo.width === 0 || canvasInfo.height === 0) {
    console.error("FAIL: Canvas has zero dimensions")
  }

  // Check if canvas has any non-transparent pixels
  const hasContent = await page.evaluate(() => {
    const canvas = document.getElementById("terminal-canvas")
    const ctx = canvas.getContext("2d")
    // Sample a 100x100 region from the canvas
    const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 200), Math.min(canvas.height, 200))
    let nonEmpty = 0
    for (let i = 0; i < imageData.data.length; i += 4) {
      // Check if any pixel has non-zero alpha
      if (imageData.data[i + 3] > 0) nonEmpty++
    }
    return { nonEmpty, total: imageData.data.length / 4 }
  })

  console.log("Canvas content:", hasContent)

  // Take screenshot
  await page.screenshot({ path: "/Users/chris/dev/opentui-web/screenshot.png", fullPage: false })
  console.log("Screenshot saved to screenshot.png")

  if (errors.length > 0) {
    console.error("\nBrowser errors:")
    for (const err of errors) {
      console.error("  ", err)
    }
  }

  if (logs.length > 0) {
    console.log("\nBrowser logs:")
    for (const log of logs) {
      console.log("  ", log)
    }
  }

  const success = canvasInfo.exists && canvasInfo.width > 0 && hasContent.nonEmpty > 0 && errors.length === 0
  console.log(success ? "\n✅ PASS: Canvas renders content" : "\n❌ FAIL: Canvas has issues")

  await browser.close()
  process.exit(success ? 0 : 1)
}

verify().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
