import { useEffect } from "react"
import { useBrowserContext } from "./browser-context"

export function usePaste(callback: (text: string) => void): void {
  const { renderContext } = useBrowserContext()

  useEffect(() => {
    const handler = (text: string) => {
      callback(text)
    }
    renderContext.on("paste", handler)
    return () => {
      renderContext.off("paste", handler)
    }
  }, [renderContext, callback])
}
