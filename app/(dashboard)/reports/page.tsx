import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklySummaryTable } from "@/components/reports/weekly-summary-table";
import { LocationTable } from "@/components/reports/location-table";
import { MonthMachineTable } from "@/components/reports/month-machine-table";
import { ExportButton } from "@/components/reports/export-button";
import { getReportsData } from "@/lib/reports";

export const revalidate = 300;

export const metadata = {
  title: "Reports | SeeYou AroundTown",
};

export default async function ReportsPage() {
  const data = await getReportsData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">All-time summary</p>
        </div>
        {!data.isEmpty && <ExportButton data={data} />}
      </div>

      {data.isEmpty ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-16 text-center text-sm text-muted-foreground">
          No collections recorded yet. Record your first collection to generate reports.
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Weekly Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <WeeklySummaryTable byWeek={data.byWeek} totals={data.totals} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">By Location</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <LocationTable byLocation={data.byLocation} totals={data.totals} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Monthly by Machine</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <MonthMachineTable rows={data.byMonthMachine} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
