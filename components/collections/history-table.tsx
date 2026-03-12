"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Trash2 } from "lucide-react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CollectionDetailModal } from "./collection-detail-modal";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { MACHINE_LOCATIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CollectionRow } from "@/lib/collections";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface HistoryTableProps {
  collections: CollectionRow[];
  pagination: Pagination;
  filters: {
    location?: string;
    week?: string;
    startDate?: string;
    endDate?: string;
    sort?: string;
    order?: string;
  };
}

function fmt(n: number) {
  return "฿" + n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function SortIcon({ col, sort, order }: { col: string; sort: string; order: string }) {
  if (sort !== col) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />;
  return order === "asc"
    ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
    : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
}

export function HistoryTable({ collections: initialCollections, pagination, filters }: HistoryTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [viewCollection, setViewCollection] = useState<CollectionRow | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const rows = useMemo(
    () => initialCollections.filter((r) => !deletedIds.has(r.id)),
    [initialCollections, deletedIds]
  );

  const sort = filters.sort ?? "date";
  const order = filters.order ?? "desc";

  const pushParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === "") params.delete(k);
        else params.set(k, v);
      });
      // reset page on filter/sort change (unless page is being set)
      if (!("page" in updates)) params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  function handleSort(col: string) {
    if (sort === col) {
      pushParams({ sort: col, order: order === "asc" ? "desc" : "asc" });
    } else {
      pushParams({ sort: col, order: "desc" });
    }
  }

  function handleDeleted(id: number) {
    setDeletedIds((prev) => new Set(prev).add(id));
  }

  const hasFilters =
    filters.location || filters.week || filters.startDate || filters.endDate;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Location</label>
          <Select
            value={filters.location ?? "all"}
            onValueChange={(v) => pushParams({ location: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {MACHINE_LOCATIONS.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Week</label>
          <Input
            type="number"
            placeholder="All weeks"
            className="w-28"
            defaultValue={filters.week ?? ""}
            onBlur={(e) => pushParams({ week: e.target.value || undefined })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                pushParams({ week: (e.target as HTMLInputElement).value || undefined });
              }
            }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input
            type="date"
            className="w-36"
            defaultValue={filters.startDate ?? ""}
            onChange={(e) => pushParams({ startDate: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input
            type="date"
            className="w-36"
            defaultValue={filters.endDate ?? ""}
            onChange={(e) => pushParams({ endDate: e.target.value || undefined })}
          />
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              pushParams({
                location: undefined,
                week: undefined,
                startDate: undefined,
                endDate: undefined,
              })
            }
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">
            {hasFilters ? "No collections match your filters." : "No collections yet."}
          </p>
          {hasFilters && (
            <Button
              variant="link"
              size="sm"
              onClick={() =>
                pushParams({ location: undefined, week: undefined, startDate: undefined, endDate: undefined })
              }
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort("date")}
                  >
                    Date <SortIcon col="date" sort={sort} order={order} />
                  </button>
                </TableHead>
                <TableHead>Rnd</TableHead>
                <TableHead>
                  <button
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort("week")}
                  >
                    Wk <SortIcon col="week" sort={sort} order={order} />
                  </button>
                </TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Coins</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">
                  <button
                    className="flex items-center ml-auto hover:text-foreground transition-colors"
                    onClick={() => handleSort("revenue")}
                  >
                    Revenue <SortIcon col="revenue" sort={sort} order={order} />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    className="flex items-center ml-auto hover:text-foreground transition-colors"
                    onClick={() => handleSort("profit")}
                  >
                    Profit <SortIcon col="profit" sort={sort} order={order} />
                  </button>
                </TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(row.collectionDate), "dd MMM yy")}
                  </TableCell>
                  <TableCell>{row.roundNumber}</TableCell>
                  <TableCell>{row.weekNumber}</TableCell>
                  <TableCell className="max-w-[140px] truncate">
                    {row.machineLocation.split(" - ")[0]}
                  </TableCell>
                  <TableCell className="text-right">{row.machineCoins10baht}</TableCell>
                  <TableCell className="text-right">{row.postcardsSold}</TableCell>
                  <TableCell className="text-right text-thai-gold font-medium">
                    {fmt(row.revenue)}
                  </TableCell>
                  <TableCell className={cn("text-right font-medium", row.profit >= 0 ? "text-green-500" : "text-destructive")}>
                    {fmt(row.profit)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.exchangeBalanced ? "default" : "destructive"}
                      className={cn("text-xs", row.exchangeBalanced ? "bg-green-600 hover:bg-green-700" : "")}
                    >
                      {row.exchangeBalanced ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewCollection(row)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(row.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pushParams({ page: String(pagination.page - 1) })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pushParams({ page: String(pagination.page + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CollectionDetailModal
        collection={viewCollection}
        open={viewCollection !== null}
        onOpenChange={(open) => { if (!open) setViewCollection(null); }}
      />
      <DeleteConfirmDialog
        collectionId={deleteId ?? 0}
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
