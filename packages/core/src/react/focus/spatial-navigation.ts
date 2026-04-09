import type { FocusEntry } from "./types"

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// Higher weight = prefer elements directly aligned on the primary axis
const SECONDARY_WEIGHT = 4

/**
 * Ensure yoga layout positions are computed for the tree containing `ref`.
 * The browser render pipeline may not have called calculateLayout() yet
 * when React reconciliation completes after the initial render frame.
 */
function ensureLayoutComputed(ref: any): void {
  let root = ref
  while (root.parent) root = root.parent

  const yogaNode = root.yogaNode
  if (!yogaNode || !yogaNode.isDirty()) return

  root.calculateLayout()

  function applyLayout(node: any): void {
    node.updateFromLayout()
    const children = node._childrenInZIndexOrder
    if (children) {
      for (const child of children) {
        applyLayout(child)
      }
    }
  }
  applyLayout(root)
}

/**
 * Find the best spatial navigation target for a given direction.
 * Uses edge-based direction checks so elements in the same row/column
 * (even with slight pixel offsets) aren't considered wrong-direction candidates.
 * Returns the target entry ID, or null if no candidate exists.
 */
export function findSpatialTarget(
  direction: "up" | "down" | "left" | "right",
  currentId: string,
  navigableEntries: FocusEntry[],
  refs: Map<string, any>,
): string | null {
  const currentRef = refs.get(currentId)
  if (!currentRef) return null

  ensureLayoutComputed(currentRef)

  const current = getRect(currentRef)
  if (!current) return null

  const cx = current.x + current.width / 2
  const cy = current.y + current.height / 2

  let bestId: string | null = null
  let bestScore = Infinity

  for (const entry of navigableEntries) {
    if (entry.id === currentId) continue

    const ref = refs.get(entry.id)
    if (!ref) continue

    const rect = getRect(ref)
    if (!rect) continue

    const tx = rect.x + rect.width / 2
    const ty = rect.y + rect.height / 2

    // Edge-based direction check: candidate must be past the current element's edge
    // to avoid false positives from sub-pixel alignment differences in the same row/column
    let inDirection = false
    let primaryDist = 0
    let secondaryDist = 0

    switch (direction) {
      case "up":
        inDirection = rect.y + rect.height <= current.y
        primaryDist = cy - ty
        secondaryDist = Math.abs(tx - cx)
        break
      case "down":
        inDirection = rect.y >= current.y + current.height
        primaryDist = ty - cy
        secondaryDist = Math.abs(tx - cx)
        break
      case "left":
        inDirection = rect.x + rect.width <= current.x
        primaryDist = cx - tx
        secondaryDist = Math.abs(ty - cy)
        break
      case "right":
        inDirection = rect.x >= current.x + current.width
        primaryDist = tx - cx
        secondaryDist = Math.abs(ty - cy)
        break
    }

    if (!inDirection) continue

    const score = primaryDist + secondaryDist * SECONDARY_WEIGHT
    if (score < bestScore) {
      bestScore = score
      bestId = entry.id
    }
  }

  return bestId
}

function getRect(ref: any): Rect | null {
  if (ref == null || typeof ref.x !== "number") return null
  return { x: ref.x, y: ref.y, width: ref.width, height: ref.height }
}
