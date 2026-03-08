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
      className={cn('rounded-2xl border shadow-lg overflow-hidden', className)}
      style={{
        ...(minWidth != null ? { minWidth } : {}),
        ...(transparent ? {} : { backgroundColor: '#1e1e2e' }),
      }}
    >
      {/* Window Title Bar */}
      <div
        className="grid grid-cols-3 items-center px-3 py-2.5 border-b"
        style={transparent ? {} : { backgroundColor: '#2a2a3c', borderColor: '#313244' }}
      >
        {/* Traffic Light Buttons */}
        <div className="flex gap-2">
          <button onClick={onClose} className="w-3 h-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors" aria-label="Close" type="button" />
          <button onClick={onMinimize} className="w-3 h-3 bg-yellow-500 hover:bg-yellow-600 rounded-full transition-colors" aria-label="Minimize" type="button" />
          <button onClick={onMaximize} className="w-3 h-3 bg-green-500 hover:bg-green-600 rounded-full transition-colors" aria-label="Maximize" type="button" />
        </div>
        {/* Optional Title - Centered */}
        {title && <div className="text-center text-sm select-none" style={transparent ? {} : { color: '#a6adc8' }}>{title}</div>}
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
