import type { Screen } from "./screen"

export interface WaitForOptions {
  /** Timeout in ms (default: 3000) */
  timeout?: number
  /** Polling interval in ms (default: 50) */
  interval?: number
}

/**
 * Wait for a condition to be met on the screen.
 *
 * @param screen - The screen to poll
 * @param condition - Either a string (wait for screen to contain it) or a function (wait for it to not throw)
 * @param options - Timeout and interval settings
 */
export async function waitFor(
  screen: Screen,
  condition: string | (() => void),
  options: WaitForOptions = {},
): Promise<void> {
  const { timeout = 3000, interval = 50 } = options
  const start = Date.now()

  while (true) {
    try {
      if (typeof condition === "string") {
        if (screen.contains(condition)) return
        if (Date.now() - start > timeout) {
          throw new Error(
            `waitFor timed out after ${timeout}ms waiting for "${condition}"\n\nScreen content:\n${screen.text()}`,
          )
        }
      } else {
        condition()
        return
      }
    } catch (error) {
      if (Date.now() - start > timeout) {
        if (typeof condition === "string") {
          throw new Error(
            `waitFor timed out after ${timeout}ms waiting for "${condition}"\n\nScreen content:\n${screen.text()}`,
          )
        }
        throw error
      }
    }

    await new Promise((resolve) => setTimeout(resolve, interval))
  }
}
