// @ts-nocheck
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@gridland/ui"

export function TableApp() {
  return (
    <box padding={1}>
      <TableRoot>
        <TableCaption>Recent invoices</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead align="right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>INV001</TableCell>
            <TableCell color="green">Paid</TableCell>
            <TableCell>2</TableCell>
            <TableCell align="right">$500.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>INV002</TableCell>
            <TableCell color="yellow">Pending</TableCell>
            <TableCell>1</TableCell>
            <TableCell align="right">$150.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>INV003</TableCell>
            <TableCell color="red">Overdue</TableCell>
            <TableCell>3</TableCell>
            <TableCell align="right">$750.00</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell align="right">$1,400.00</TableCell>
          </TableRow>
        </TableFooter>
      </TableRoot>
    </box>
  )
}
