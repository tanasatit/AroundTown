import { StatsCardsSkeleton } from "@/components/dashboard/stats-cards-skeleton";
import { DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <StatsCardsSkeleton />
      <DashboardChartsSkeleton />
    </div>
  );
}
