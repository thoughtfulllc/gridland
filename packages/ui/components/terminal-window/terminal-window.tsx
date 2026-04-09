import type { ReactNode } from "react"

export interface TerminalWindowProps {
  /** Content rendered inside the window below the title bar. */
  children: ReactNode
  /** Additional CSS classes applied to the outermost container. */
  className?: string
  /** Text displayed centered in the title bar. */
  title?: string
  /** Minimum width of the window. Applied as inline style. */
  minWidth?: number | string
  /** When true, the window background is transparent. Defaults to false (dark gray). */
  transparent?: boolean
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

/** macOS-style window chrome with traffic-light buttons and title bar. Web/HTML component for docs and demos. */
export function TerminalWindow({
  children,
  className,
  title,
  minWidth,
  transparent = false,
  onClose,
  onMinimize,
  onMaximize,
}: TerminalWindowProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border shadow-lg overflow-hidden",
        className,
      )}
      style={{
        ...(minWidth != null ? { minWidth } : {}),
        ...(transparent ? {} : { backgroundColor: "#1e1e2e" }),
      }}
    >
      {/* Title Bar */}
      <div
        className="grid grid-cols-3 items-center px-3 py-2.5 border-b"
        style={transparent ? {} : { backgroundColor: "#2a2a3c", borderColor: "#313244" }}
      >
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
          <div
            className="text-center text-sm select-none"
            style={transparent ? {} : { color: "#a6adc8" }}
          >
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
