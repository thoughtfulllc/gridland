const OPENTUI_URL = "https://opentui.dev"

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ")
}

// ── CornerRibbon ────────────────────────────────────────────────────────

export interface CornerRibbonProps {
  /** Which corner to display the ribbon in. */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  /** Additional CSS classes applied to the ribbon link element. */
  className?: string
  /** When true, uses position: absolute instead of fixed. */
  absolute?: boolean
}

const cornerStyles: Record<
  string,
  { container: React.CSSProperties; ribbon: React.CSSProperties }
> = {
  "top-right": {
    container: { top: 0, right: 0 },
    ribbon: { transform: "rotate(45deg) translate(14px, 32px)" },
  },
  "top-left": {
    container: { top: 0, left: 0 },
    ribbon: { transform: "rotate(-45deg) translate(-14px, 32px)" },
  },
  "bottom-right": {
    container: { bottom: 0, right: 0 },
    ribbon: { transform: "rotate(-45deg) translate(14px, -32px)" },
  },
  "bottom-left": {
    container: { bottom: 0, left: 0 },
    ribbon: { transform: "rotate(45deg) translate(-14px, -32px)" },
  },
}

export function CornerRibbon({
  position = "top-right",
  className,
  absolute = false,
}: CornerRibbonProps) {
  const styles = cornerStyles[position]!

  return (
    <div
      style={{
        position: absolute ? "absolute" : "fixed",
        ...styles.container,
        width: 200,
        height: 200,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <a
        href={OPENTUI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "block w-[210px] py-1.5 text-center text-[11px] font-semibold font-mono uppercase tracking-wider no-underline shadow-sm",
          "bg-neutral-200 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-400",
          className,
        )}
        style={{
          ...styles.ribbon,
          pointerEvents: "auto",
        }}
      >
        made with opentui
      </a>
    </div>
  )
}

// ── BadgeButton ─────────────────────────────────────────────────────────

export interface BadgeButtonProps {
  /** Visual style variant. */
  variant?: "dark" | "light" | "outline"
  /** Additional CSS classes applied to the link element. */
  className?: string
}

const variantClasses: Record<string, string> = {
  dark: "bg-black text-white border-transparent dark:bg-white dark:text-black",
  light:
    "bg-white text-black border-neutral-200 dark:bg-black dark:text-white dark:border-neutral-700",
  outline: "bg-transparent text-current border-current",
}

export function BadgeButton({
  variant = "dark",
  className,
}: BadgeButtonProps) {
  return (
    <a
      href={OPENTUI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs font-medium leading-none no-underline border transition-opacity hover:opacity-80",
        variantClasses[variant],
        className,
      )}
    >
      <span className="text-sm">{">_"}</span>
      <span>made with opentui</span>
    </a>
  )
}

// ── TextBadge ───────────────────────────────────────────────────────────

export interface TextBadgeProps {
  /** Additional CSS classes applied to the link element. */
  className?: string
}

export function TextBadge({ className }: TextBadgeProps) {
  return (
    <a
      href={OPENTUI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[11px] text-inherit no-underline opacity-50 transition-opacity hover:opacity-80",
        className,
      )}
    >
      <span>{">_"}</span>
      <span>made with opentui</span>
    </a>
  )
}
