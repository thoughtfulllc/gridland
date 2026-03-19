// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@gridland/ui"

export default function TableDemo() {
  return (
    <DemoWindow title="Table" tuiStyle={{ width: "100%", height: 240 }}>
      <box padding={1}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>name</TableHead>
              <TableHead>role</TableHead>
              <TableHead>status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Alice</TableCell>
              <TableCell>Engineer</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Bob</TableCell>
              <TableCell>Designer</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Charlie</TableCell>
              <TableCell>PM</TableCell>
              <TableCell>Away</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </box>
    </DemoWindow>
  )
}
