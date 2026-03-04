import { useEffect, useState } from "react"
import { useBrowserContext } from "./browser-context"

export interface DroppedFile {
  name: string
  content: string
  type: string
  size: number
}

export function useFileDrop(callback: (file: DroppedFile) => void): { isDragOver: boolean } {
  const { renderContext } = useBrowserContext()
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    const handler = (file: DroppedFile) => {
      callback(file)
    }
    const onDragEnter = () => setIsDragOver(true)
    const onDragLeave = () => setIsDragOver(false)

    renderContext.on("file-drop", handler)
    renderContext.on("drag-enter", onDragEnter)
    renderContext.on("drag-leave", onDragLeave)
    return () => {
      renderContext.off("file-drop", handler)
      renderContext.off("drag-enter", onDragEnter)
      renderContext.off("drag-leave", onDragLeave)
    }
  }, [renderContext, callback])

  return { isDragOver }
}
