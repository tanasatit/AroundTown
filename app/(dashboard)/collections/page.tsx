import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HistoryTable } from "@/components/collections/history-table";
import { getCollections } from "@/lib/collections";
import { prisma } from "@/lib/prisma";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    location?: string;
    week?: string;
    startDate?: string;
    endDate?: string;
    sort?: string;
    order?: string;
  }>;
}

export const metadata = {
  title: "Collections | SeeYou AroundTown",
};

export default async function CollectionsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [{ collections, pagination }, machineRows] = await Promise.all([
    getCollections({
      page: params.page ? Number(params.page) : 1,
      location: params.location,
      week: params.week ? Number(params.week) : undefined,
      startDate: params.startDate,
      endDate: params.endDate,
      sort: params.sort,
      order: params.order,
    }),
    prisma.machine.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  const machines = machineRows.map((m) => m.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold">Collections</h1>
          <p className="text-sm text-muted-foreground">
            {pagination.total} record{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/collections/new">
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Link>
        </Button>
      </div>

      <HistoryTable
        collections={collections}
        pagination={pagination}
        machines={machines}
        filters={{
          location: params.location,
          week: params.week,
          startDate: params.startDate,
          endDate: params.endDate,
          sort: params.sort,
          order: params.order,
        }}
      />
    </div>
  );
}
