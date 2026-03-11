export interface Theme {
  /** Main brand color — headings, highlights, active elements */
  primary: string
  /** Secondary brand color — interactive highlights, focused states */
  accent: string
  /** Tertiary color — user messages, checkboxes, prompts */
  secondary: string
  /** Subdued color — disabled states, placeholders, secondary text */
  muted: string
  /** Border and divider color */
  border: string
  /** Default foreground text color */
  foreground: string
  /** App background color */
  background: string
  /** Success state color */
  success: string
  /** Error state color */
  error: string
  /** Warning state color */
  warning: string
}
