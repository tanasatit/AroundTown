import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MonthMachineRow } from "@/lib/reports";

function fmt(n: number) {
  return "฿" + n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  rows: MonthMachineRow[];
}

export function MonthMachineTable({ rows }: Props) {
  // Track which month labels have been shown
  const shownMonths = new Set<string>();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Month</TableHead>
          <TableHead>Machine</TableHead>
          <TableHead className="text-right">Collections</TableHead>
          <TableHead className="text-right">Postcards Sold</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => {
          const showMonth = !shownMonths.has(row.monthLabel);
          if (showMonth) shownMonths.add(row.monthLabel);
          return (
            <TableRow key={`${row.year}-${row.monthNum}-${row.location}`}>
              <TableCell className="font-medium whitespace-nowrap">
                {showMonth ? row.monthLabel : ""}
              </TableCell>
              <TableCell>{row.location}</TableCell>
              <TableCell className="text-right">{row.collections}</TableCell>
              <TableCell className="text-right">{row.postcardsSold}</TableCell>
              <TableCell className="text-right text-thai-gold">{fmt(row.revenue)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
