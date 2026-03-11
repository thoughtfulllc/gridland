import type { ReactNode } from 'react'

export interface TerminalWindowProps {
  children: ReactNode
  className?: string
  title?: string
  minWidth?: number | string
  transparent?: boolean
  titleBarRight?: ReactNode
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export const TerminalWindow = ({ children, className, title, minWidth, transparent = false, titleBarRight, onClose, onMinimize, onMaximize }: TerminalWindowProps) => {
  return (
    <div
      className={cn(
        'rounded-2xl border shadow-lg overflow-hidden',
        !transparent && 'bg-[#f5f5f5] dark:bg-[#1e1e2e]',
        className,
      )}
      style={minWidth != null ? { minWidth } : undefined}
    >
      {/* Window Title Bar */}
      <div
        className={cn(
          'grid grid-cols-3 items-center px-3 py-2.5 border-b',
          !transparent && 'bg-[#e8e8e8] border-[#d4d4d4] dark:bg-[#2a2a3c] dark:border-[#313244]',
        )}
      >
        {/* Traffic Light Buttons */}
        <div className="flex gap-2">
          <button onClick={onClose} className="w-3 h-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors" aria-label="Close" type="button" />
          <button onClick={onMinimize} className="w-3 h-3 bg-yellow-500 hover:bg-yellow-600 rounded-full transition-colors" aria-label="Minimize" type="button" />
          <button onClick={onMaximize} className="w-3 h-3 bg-green-500 hover:bg-green-600 rounded-full transition-colors" aria-label="Maximize" type="button" />
        </div>
        {/* Optional Title - Centered */}
        {title && <div className={cn('text-center text-sm select-none', !transparent && 'text-[#6e6e6e] dark:text-[#a6adc8]')}>{title}</div>}
        {/* Right column */}
        {titleBarRight ?? <div />}
      </div>
      {/* Window Content */}
      <div className="overflow-x-auto overscroll-x-none">
        <div style={minWidth != null ? { minWidth, contain: 'content' } : undefined}>{children}</div>
      </div>
    </div>
  )
}
