// @ts-nocheck
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@gridland/ui"

export function TableApp() {
  return (
    <box padding={1}>
      <TableRoot>
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
      </TableRoot>
    </box>
  )
}
