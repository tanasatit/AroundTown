"use client";

import { format } from "date-fns";
import { Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EXCHANGE_DENOMINATIONS } from "@/lib/constants";
import type { CollectionRow } from "@/lib/collections";

interface CollectionDetailModalProps {
  collection: CollectionRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function fmt(n: number) {
  return "฿" + n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function CollectionDetailModal({
  collection,
  open,
  onOpenChange,
}: CollectionDetailModalProps) {
  if (!collection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {format(new Date(collection.collectionDate), "dd MMM yyyy")} — Round{" "}
            {collection.roundNumber}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{collection.machineLocation}</p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Machine */}
          <section className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Machine
            </h3>
            <div className="rounded-lg border p-3 space-y-0.5">
              <Row label="10฿ Coins" value={collection.machineCoins10baht} />
              <Row label="Machine Total" value={fmt(collection.machineTotal)} />
              <Row label="Postcards Sold" value={collection.postcardsSold} />
            </div>
          </section>

          {/* Exchange Box */}
          <section className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Exchange Box
              </h3>
              <Badge
                variant={collection.exchangeBalanced ? "default" : "destructive"}
                className={cn(collection.exchangeBalanced ? "bg-green-600 hover:bg-green-700" : "")}
              >
                {collection.exchangeBalanced ? (
                  <><Check className="mr-1 h-3 w-3" />Balanced</>
                ) : (
                  <><X className="mr-1 h-3 w-3" />Unbalanced</>
                )}
              </Badge>
            </div>
            <div className="rounded-lg border p-3">
              <div className="grid grid-cols-3 gap-x-4 gap-y-0.5">
                {EXCHANGE_DENOMINATIONS.map((d) => {
                  const count = (collection as Record<string, unknown>)[d.key] as number;
                  return (
                    <div key={d.key} className="flex justify-between text-sm py-0.5">
                      <span className="text-muted-foreground">{d.label}</span>
                      <span>{count}</span>
                    </div>
                  );
                })}
              </div>
              {(collection.exchangeTransfer ?? 0) > 0 && (
                <div className="flex justify-between text-sm py-0.5 mt-1">
                  <span className="text-muted-foreground">Bank Transfer</span>
                  <span>{fmt(collection.exchangeTransfer ?? 0)}</span>
                </div>
              )}
              <div className="border-t mt-2 pt-2">
                <Row label="Total" value={fmt(collection.exchangeTotal)} />
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Summary
            </h3>
            <div className="rounded-lg border p-3 space-y-0.5">
              <Row label="Revenue" value={<span className="text-thai-gold">{fmt(collection.revenue)}</span>} />
              <Row label="Cost" value={<span className="text-destructive">{fmt(collection.cost)}</span>} />
              <Row label="Profit" value={<span className="text-green-500">{fmt(collection.profit)}</span>} />
            </div>
          </section>

          {/* Footer details */}
          <section className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Other
            </h3>
            <div className="rounded-lg border p-3 space-y-0.5">
              <Row label="Postcards Remaining" value={collection.postcardsRemaining} />
              <Row label="Cost / Postcard" value={fmt(collection.costPerPostcard)} />
              <Row label="Notes" value={collection.notes || "—"} />
              <Row label="Created By" value={collection.user?.name || collection.user?.email || "—"} />
              <Row
                label="Created At"
                value={format(new Date(collection.createdAt), "dd MMM yyyy HH:mm")}
              />
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
