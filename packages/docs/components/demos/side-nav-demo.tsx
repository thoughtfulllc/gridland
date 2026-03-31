// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { SideNav, textStyle } from "@gridland/ui"

const items = [
  { id: "inbox", name: "Inbox" },
  { id: "drafts", name: "Drafts" },
  { id: "sent", name: "Sent" },
  { id: "trash", name: "Trash" },
]

const content: Record<string, { count: number; messages: string[] }> = {
  inbox: { count: 3, messages: ["Re: deployment plan", "Weekly sync notes", "Bug report #482"] },
  drafts: { count: 1, messages: ["Draft: Q2 roadmap update"] },
  sent: { count: 2, messages: ["Sent: PR review feedback", "Sent: Team standup recap"] },
  trash: { count: 0, messages: [] },
}

function PanelContent({ activeId }: { activeId: string }) {
  const data = content[activeId]
  if (!data) return null

  return (
    <box flexDirection="column" padding={1} flexGrow={1}>
      <text style={textStyle({ dim: true })}>{data.count} item{data.count !== 1 ? "s" : ""}</text>
      <box marginTop={1} flexDirection="column">
        {data.messages.length > 0
          ? data.messages.map((msg, i) => (
              <text key={i}>{msg}</text>
            ))
          : <text style={textStyle({ dim: true })}>No messages</text>
        }
      </box>
    </box>
  )
}

export default function SideNavDemo() {
  return (
    <DemoWindow title="SideNav" tuiStyle={{ width: "100%", height: 300 }} autoFocus>
      <SideNav items={items} title="Mail">
        {({ activeItem }) => (
          <PanelContent activeId={activeItem.id} />
        )}
      </SideNav>
    </DemoWindow>
  )
}
