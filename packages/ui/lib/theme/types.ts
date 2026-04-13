export interface Theme {
  /** Main brand color — headings, highlights, active elements */
  primary: string
  /** Secondary brand color — interactive highlights, focused states */
  accent: string
  /** Tertiary color — user messages, checkboxes, prompts */
  secondary: string
  /** Subdued color — disabled states, secondary text, cursor */
  muted: string
  /** Placeholder text color */
  placeholder: string
  /** Border and divider color */
  border: string
  /** Muted border color — subtle structural dividers */
  borderMuted: string
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
  /** Bright focus color — component is selected (entered for interaction) */
  focusSelected: string
  /** Medium focus color — component has keyboard focus */
  focusFocused: string
  /** Dimmed focus color — idle hint that the component is selectable */
  focusIdle: string
  /** Background color for assistant message bubbles */
  messageAssistant: string
  /** Background color for user message bubbles */
  messageUser: string
}
