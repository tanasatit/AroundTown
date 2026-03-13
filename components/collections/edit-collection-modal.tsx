"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { createCollectionSchema, type CreateCollectionFormInput } from "@/lib/validations/collection";
import {
  EXCHANGE_DENOMINATIONS,
  EXCHANGE_BALANCE_TARGET,
  DEFAULT_COST_PER_POSTCARD,
} from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CollectionRow } from "@/lib/collections";

interface EditCollectionModalProps {
  collection: CollectionRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (updated: CollectionRow) => void;
  machines: string[];
}

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function EditCollectionModal({
  collection,
  open,
  onOpenChange,
  onUpdated,
  machines,
}: EditCollectionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateCollectionFormInput>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: {
      collectionDate: new Date().toISOString().split("T")[0],
      roundNumber: 1,
      weekNumber: 1,
      machineLocation: "",
      machineCoins10baht: undefined,
      exchangeCoins1baht: undefined,
      exchangeCoins2baht: undefined,
      exchangeCoins5baht: undefined,
      exchangeCoins10baht: undefined,
      exchangeNote20baht: undefined,
      exchangeNote50baht: undefined,
      exchangeNote100baht: undefined,
      exchangeNote500baht: undefined,
      exchangeNote1000baht: undefined,
      postcardsRemaining: undefined,
      costPerPostcard: DEFAULT_COST_PER_POSTCARD,
      notes: "",
    },
  });

  const { register, handleSubmit, setValue, control, reset, formState: { errors } } = form;

  // Populate form when collection changes
  useEffect(() => {
    if (!collection) return;
    reset({
      collectionDate: format(new Date(collection.collectionDate), "yyyy-MM-dd"),
      roundNumber: collection.roundNumber as 1 | 2,
      weekNumber: collection.weekNumber,
      machineLocation: collection.machineLocation,
      machineCoins10baht: collection.machineCoins10baht,
      exchangeCoins1baht: (collection as unknown as Record<string, number>).exchangeCoins1baht ?? 0,
      exchangeCoins2baht: (collection as unknown as Record<string, number>).exchangeCoins2baht ?? 0,
      exchangeCoins5baht: (collection as unknown as Record<string, number>).exchangeCoins5baht ?? 0,
      exchangeCoins10baht: (collection as unknown as Record<string, number>).exchangeCoins10baht ?? 0,
      exchangeNote20baht: (collection as unknown as Record<string, number>).exchangeNote20baht ?? 0,
      exchangeNote50baht: (collection as unknown as Record<string, number>).exchangeNote50baht ?? 0,
      exchangeNote100baht: (collection as unknown as Record<string, number>).exchangeNote100baht ?? 0,
      exchangeNote500baht: (collection as unknown as Record<string, number>).exchangeNote500baht ?? 0,
      exchangeNote1000baht: (collection as unknown as Record<string, number>).exchangeNote1000baht ?? 0,
      postcardsRemaining: collection.postcardsRemaining ?? undefined,
      costPerPostcard: collection.costPerPostcard ?? DEFAULT_COST_PER_POSTCARD,
      notes: collection.notes ?? "",
    });
  }, [collection, reset]);

  const watchedValues = useWatch({ control });

  const calculations = useMemo(() => {
    const machineCoins = watchedValues.machineCoins10baht || 0;
    const machineTotal = machineCoins * 10;
    const postcardsSold = Math.floor(machineCoins / 4);
    const revenue = postcardsSold * 40;
    const costPerPostcard = watchedValues.costPerPostcard || DEFAULT_COST_PER_POSTCARD;
    const cost = postcardsSold * costPerPostcard;
    const profit = revenue - cost;

    const exchangeTotal = EXCHANGE_DENOMINATIONS.reduce((sum, denom) => {
      const count = (watchedValues as Record<string, number>)[denom.key] || 0;
      return sum + count * denom.value;
    }, 0) + (watchedValues.exchangeTransfer || 0);

    const exchangeBalanced = Math.abs(exchangeTotal - EXCHANGE_BALANCE_TARGET) < 1;

    return { machineTotal, postcardsSold, revenue, cost, profit, exchangeTotal, exchangeBalanced };
  }, [watchedValues]);

  const onSubmit = async (data: CreateCollectionFormInput) => {
    if (!collection) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update");
      toast.success("Collection updated");
      onUpdated(result);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!collection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Date + Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-collectionDate">Collection Date</Label>
              <Input
                id="edit-collectionDate"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={watchedValues.collectionDate ?? ""}
                onChange={(e) => setValue("collectionDate", e.target.value, { shouldValidate: true })}
              />
              {errors.collectionDate && (
                <p className="text-sm text-destructive">{errors.collectionDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Machine Location</Label>
              <Select
                value={watchedValues.machineLocation}
                onValueChange={(v) => setValue("machineLocation", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.machineLocation && (
                <p className="text-sm text-destructive">{errors.machineLocation.message}</p>
              )}
            </div>
          </div>

          {/* Round + Week */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Round</Label>
              <div className="flex gap-2">
                {[1, 2].map((round) => (
                  <Button
                    key={round}
                    type="button"
                    variant={watchedValues.roundNumber === round ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setValue("roundNumber", round as 1 | 2, { shouldValidate: true })}
                  >
                    {round}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-weekNumber">Week</Label>
              <Input
                id="edit-weekNumber"
                type="number"
                min={1}
                {...register("weekNumber", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Machine coins */}
          <div className="space-y-2">
            <Label htmlFor="edit-machineCoins10baht">10-baht Coins Count</Label>
            <Input
              id="edit-machineCoins10baht"
              type="number"
              min={0}
              step={4}
              {...register("machineCoins10baht", { valueAsNumber: true })}
            />
            {errors.machineCoins10baht && (
              <p className="text-sm text-destructive">{errors.machineCoins10baht.message}</p>
            )}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Machine Total</p>
                <p className="text-lg font-semibold text-thai-gold">฿{fmt(calculations.machineTotal)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Postcards Sold</p>
                <p className="text-lg font-semibold">{calculations.postcardsSold}</p>
              </div>
            </div>
          </div>

          {/* Exchange box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Exchange Box</Label>
              <Badge
                variant="outline"
                className={cn(calculations.exchangeBalanced ? "bg-green-600/30 text-green-400 hover:bg-green-600/40 border-green-600/40" : "bg-red-600/30 text-red-400 hover:bg-red-600/40 border-red-600/40")}
              >
                {calculations.exchangeBalanced
                  ? <><Check className="mr-1 h-3 w-3" />Balanced</>
                  : <><X className="mr-1 h-3 w-3" />฿{fmt(calculations.exchangeTotal)}</>
                }
              </Badge>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {EXCHANGE_DENOMINATIONS.map((denom) => (
                <div key={denom.key} className="space-y-1">
                  <Label htmlFor={`edit-${denom.key}`} className="text-xs">{denom.label}</Label>
                  <Input
                    id={`edit-${denom.key}`}
                    type="number"
                    min={0}
                    className="h-9"
                    placeholder="0"
                    {...register(denom.key as keyof CreateCollectionFormInput, { valueAsNumber: true })}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-exchangeTransfer" className="text-xs">Bank Transfer / PromptPay (฿)</Label>
              <Input
                id="edit-exchangeTransfer"
                type="number"
                min={0}
                className="h-9"
                placeholder="0"
                {...register("exchangeTransfer" as keyof CreateCollectionFormInput, { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Inventory + Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-postcardsRemaining">Postcards Remaining</Label>
              <Input
                id="edit-postcardsRemaining"
                type="number"
                min={0}
                {...register("postcardsRemaining", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-costPerPostcard">Cost per Postcard</Label>
              <Input
                id="edit-costPerPostcard"
                type="number"
                step="0.001"
                min={1}
                max={50}
                {...register("costPerPostcard", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-lg font-semibold text-thai-gold">฿{fmt(calculations.revenue)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Cost</p>
              <p className="text-lg font-semibold text-destructive">฿{fmt(calculations.cost)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Profit</p>
              <p className="text-lg font-semibold text-green-500">฿{fmt(calculations.profit)}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              placeholder="Any additional notes..."
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
