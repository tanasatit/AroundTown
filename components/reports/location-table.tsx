import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { LocationRow, ReportsTotals } from "@/lib/reports";

function fmt(n: number) {
  return "฿" + n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  byLocation: LocationRow[];
  totals: ReportsTotals;
}

export function LocationTable({ byLocation, totals }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Location</TableHead>
          <TableHead className="text-right">Collections</TableHead>
          <TableHead className="text-right">Postcards Sold</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Cost</TableHead>
          <TableHead className="text-right">Profit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {byLocation.map((row) => (
          <TableRow key={row.location}>
            <TableCell className="font-medium">{row.location}</TableCell>
            <TableCell className="text-right">{row.collections}</TableCell>
            <TableCell className="text-right">{row.postcardsSold}</TableCell>
            <TableCell className={cn("text-right text-thai-gold")}>{fmt(row.revenue)}</TableCell>
            <TableCell className="text-right text-destructive">{fmt(row.cost)}</TableCell>
            <TableCell className="text-right text-green-500">{fmt(row.profit)}</TableCell>
          </TableRow>
        ))}
        <TableRow className="bg-muted/50">
          <TableCell className="font-semibold">Total</TableCell>
          <TableCell className="text-right font-semibold">{totals.collections}</TableCell>
          <TableCell className="text-right font-semibold">{totals.postcardsSold}</TableCell>
          <TableCell className={cn("text-right font-semibold text-thai-gold")}>{fmt(totals.revenue)}</TableCell>
          <TableCell className="text-right font-semibold text-destructive">{fmt(totals.cost)}</TableCell>
          <TableCell className="text-right font-semibold text-green-500">{fmt(totals.profit)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
