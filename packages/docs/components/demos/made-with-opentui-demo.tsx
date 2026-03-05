"use client"
import { BadgeButton, TextBadge } from "@polyterm.io/ui"

export default function MadeWithOpentuiDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 16 }}>
      <div>
        <p style={{ marginBottom: 8, fontWeight: 600 }}>BadgeButton (dark)</p>
        <BadgeButton variant="dark" />
      </div>
      <div>
        <p style={{ marginBottom: 8, fontWeight: 600 }}>BadgeButton (light)</p>
        <BadgeButton variant="light" />
      </div>
      <div>
        <p style={{ marginBottom: 8, fontWeight: 600 }}>BadgeButton (outline)</p>
        <BadgeButton variant="outline" />
      </div>
      <div>
        <p style={{ marginBottom: 8, fontWeight: 600 }}>TextBadge</p>
        <TextBadge />
      </div>
    </div>
  )
}
