"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportsData } from "@/lib/reports";

interface Props {
  data: ReportsData;
}

export function ExportButton({ data }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const XLSX = await import("xlsx");

      const weekRows = [
        ["Week", "Collections", "Postcards Sold", "Revenue (฿)", "Cost (฿)", "Profit (฿)"],
        ...data.byWeek.map((r) => [
          `Week ${r.weekNumber}`,
          r.collections,
          r.postcardsSold,
          r.revenue,
          r.cost,
          r.profit,
        ]),
        ["Total", data.totals.collections, data.totals.postcardsSold, data.totals.revenue, data.totals.cost, data.totals.profit],
      ];

      const locationRows = [
        ["Location", "Collections", "Postcards Sold", "Revenue (฿)", "Cost (฿)", "Profit (฿)"],
        ...data.byLocation.map((r) => [
          r.location,
          r.collections,
          r.postcardsSold,
          r.revenue,
          r.cost,
          r.profit,
        ]),
        ["Total", data.totals.collections, data.totals.postcardsSold, data.totals.revenue, data.totals.cost, data.totals.profit],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(weekRows), "Weekly Summary");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(locationRows), "By Location");

      const date = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `seeyou-report-${date}.xlsx`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export to Excel
    </Button>
  );
}
