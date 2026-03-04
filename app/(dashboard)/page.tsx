import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { StatsCardsSkeleton } from "@/components/dashboard/stats-cards-skeleton";
import { getDashboardStats } from "@/lib/stats";
import { getCurrentWeekNumber } from "@/lib/calculations";

async function DashboardStats() {
  const data = await getDashboardStats();
  return <StatsCards data={data} />;
}

export default function DashboardPage() {
  const weekNumber = getCurrentWeekNumber();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Week {weekNumber}</p>
        </div>
        <Button asChild>
          <Link href="/collections/new">
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Link>
        </Button>
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <DashboardStats />
      </Suspense>
    </div>
  );
}
