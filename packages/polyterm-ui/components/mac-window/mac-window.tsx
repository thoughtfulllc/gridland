import type { ReactNode } from "react"

export interface MacWindowProps {
  /** Content rendered inside the window below the title bar. */
  children: ReactNode
  /** Additional CSS classes applied to the outermost container. */
  className?: string
  /** Text displayed centered in the title bar. */
  title?: string
  /** Minimum width of the window. Applied as inline style. */
  minWidth?: number | string
  /** Callback fired when the red (close) button is clicked. */
  onClose?: () => void
  /** Callback fired when the yellow (minimize) button is clicked. */
  onMinimize?: () => void
  /** Callback fired when the green (maximize) button is clicked. */
  onMaximize?: () => void
}

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ")
}

export function MacWindow({
  children,
  className,
  title,
  minWidth,
  onClose,
  onMinimize,
  onMaximize,
}: MacWindowProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card shadow-lg overflow-hidden",
        className,
      )}
      style={minWidth != null ? { minWidth } : undefined}
    >
      {/* Title Bar */}
      <div className="grid grid-cols-3 items-center px-3 py-2.5 border-b bg-muted/50">
        {/* Traffic Light Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="w-3 h-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
            aria-label="Close"
            type="button"
          />
          <button
            onClick={onMinimize}
            className="w-3 h-3 bg-yellow-500 hover:bg-yellow-600 rounded-full transition-colors"
            aria-label="Minimize"
            type="button"
          />
          <button
            onClick={onMaximize}
            className="w-3 h-3 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
            aria-label="Maximize"
            type="button"
          />
        </div>
        {/* Title */}
        {title && (
          <div className="text-center text-sm text-muted-foreground select-none">
            {title}
          </div>
        )}
        {/* Empty right column for balance */}
        <div />
      </div>
      {/* Content */}
      <div className="overflow-hidden">{children}</div>
    </div>
  )
}
