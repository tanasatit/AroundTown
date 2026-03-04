"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { createCollectionSchema, type CreateCollectionInput, type CreateCollectionFormInput } from "@/lib/validations/collection";
import { getCurrentWeekNumber } from "@/lib/calculations";
import {
  MACHINE_LOCATIONS,
  EXCHANGE_DENOMINATIONS,
  EXCHANGE_BALANCE_TARGET,
  DEFAULT_COST_PER_POSTCARD,
} from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function CollectionForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showRoundWeek, setShowRoundWeek] = useState(false);

  const form = useForm<CreateCollectionFormInput>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: {
      collectionDate: format(new Date(), "yyyy-MM-dd"),
      roundNumber: 1,
      weekNumber: getCurrentWeekNumber(),
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
      postcardsAdded: undefined,
      notes: "",
    },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = form;

  const watchedValues = useWatch({ control });
  const debouncedValues = useDebounce(watchedValues, 100);

  const calculations = useMemo(() => {
    const machineCoins = debouncedValues.machineCoins10baht || 0;
    const machineTotal = machineCoins * 10;
    const postcardsSold = Math.floor(machineCoins / 4);
    const revenue = postcardsSold * 40;
    const costPerPostcard = debouncedValues.costPerPostcard || DEFAULT_COST_PER_POSTCARD;
    const cost = postcardsSold * costPerPostcard;
    const profit = revenue - cost;

    const exchangeTotal = EXCHANGE_DENOMINATIONS.reduce((sum, denom) => {
      const count = (debouncedValues as Record<string, number>)[denom.key] || 0;
      return sum + count * denom.value;
    }, 0);

    const exchangeBalanced = Math.abs(exchangeTotal - EXCHANGE_BALANCE_TARGET) < 1;

    return {
      machineTotal,
      postcardsSold,
      revenue,
      cost,
      profit,
      exchangeTotal,
      exchangeBalanced,
    };
  }, [debouncedValues]);

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        setValue("collectionDate", format(date, "yyyy-MM-dd"), {
          shouldValidate: true,
        });
        setCalendarOpen(false);
      }
    },
    [setValue]
  );

  const onSubmit = async (data: CreateCollectionFormInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create collection");
      }

      toast.success("Collection saved successfully!", {
        description: `${calculations.postcardsSold} postcards sold, ฿${calculations.profit.toFixed(2)} profit`,
        action: {
          label: "Add Another",
          onClick: () => {
            reset({
              ...data,
              machineCoins10baht: undefined,
              postcardsRemaining: undefined,
              postcardsAdded: undefined,
              notes: "",
            });
          },
        },
      });

      router.refresh();
    } catch (error) {
      toast.error("Failed to save collection", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Collection Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date and Location Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Collection Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watchedValues.collectionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedValues.collectionDate
                      ? format(new Date(watchedValues.collectionDate), "PPP")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      watchedValues.collectionDate
                        ? new Date(watchedValues.collectionDate)
                        : undefined
                    }
                    onSelect={handleDateSelect}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="rounded-lg border"
                  />
                </PopoverContent>
              </Popover>
              {errors.collectionDate && (
                <p className="text-sm text-destructive">
                  {errors.collectionDate.message}
                </p>
              )}
            </div>

            {/* Machine Location */}
            <div className="space-y-2">
              <Label>Machine Location</Label>
              <Select
                value={watchedValues.machineLocation}
                onValueChange={(value) =>
                  setValue("machineLocation", value, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {MACHINE_LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.machineLocation && (
                <p className="text-sm text-destructive">
                  {errors.machineLocation.message}
                </p>
              )}
            </div>
          </div>

          {/* Round and Week Toggle */}
          <div>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowRoundWeek(!showRoundWeek)}
            >
              {showRoundWeek ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {showRoundWeek ? "Hide Round & Week" : "Show Round & Week"}
            </button>

            {showRoundWeek && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                {/* Round Selection */}
                <div className="space-y-2">
                  <Label>Round</Label>
                  <div className="flex gap-2">
                    {[1, 2].map((round) => (
                      <Button
                        key={round}
                        type="button"
                        variant={watchedValues.roundNumber === round ? "default" : "outline"}
                        className="flex-1"
                        onClick={() =>
                          setValue("roundNumber", round as 1 | 2, { shouldValidate: true })
                        }
                      >
                        {round}
                      </Button>
                    ))}
                  </div>
                  {errors.roundNumber && (
                    <p className="text-sm text-destructive">
                      {errors.roundNumber.message}
                    </p>
                  )}
                </div>

                {/* Week Number */}
                <div className="space-y-2">
                  <Label htmlFor="weekNumber">Week</Label>
                  <Input
                    id="weekNumber"
                    type="number"
                    min={1}
                    placeholder="Auto"
                    {...register("weekNumber", { valueAsNumber: true })}
                  />
                  {errors.weekNumber && (
                    <p className="text-sm text-destructive">
                      {errors.weekNumber.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Machine Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Machine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="machineCoins10baht">10-baht Coins Count</Label>
            <Input
              id="machineCoins10baht"
              type="number"
              min={0}
              step={4}
              placeholder="e.g. 300"
              {...register("machineCoins10baht", { valueAsNumber: true })}
              autoFocus
            />
            {errors.machineCoins10baht && (
              <p className="text-sm text-destructive">
                {errors.machineCoins10baht.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Machine Total</p>
              <p className="text-2xl font-semibold text-thai-gold">
                ฿{formatCurrency(calculations.machineTotal)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Postcards Sold</p>
              <p className="text-2xl font-semibold">{calculations.postcardsSold}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Box Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Exchange Box</CardTitle>
            <Badge
              variant={calculations.exchangeBalanced ? "default" : "destructive"}
              className={cn(
                calculations.exchangeBalanced
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              )}
            >
              {calculations.exchangeBalanced ? (
                <>
                  <Check className="mr-1 h-3 w-3" /> Balanced
                </>
              ) : (
                <>
                  <X className="mr-1 h-3 w-3" /> Unbalanced
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {EXCHANGE_DENOMINATIONS.map((denom) => (
              <div key={denom.key} className="space-y-1">
                <Label htmlFor={denom.key} className="text-xs">
                  {denom.label}
                </Label>
                <Input
                  id={denom.key}
                  type="number"
                  min={0}
                  className="h-9"
                  placeholder="0"
                  {...register(denom.key as keyof CreateCollectionInput, {
                    valueAsNumber: true,
                  })}
                />
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Exchange Box Total</p>
            <p
              className={cn(
                "text-2xl font-semibold",
                calculations.exchangeBalanced ? "text-green-500" : "text-destructive"
              )}
            >
              ฿{formatCurrency(calculations.exchangeTotal)}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                / ฿{formatCurrency(EXCHANGE_BALANCE_TARGET)}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Postcard Refill Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Postcard Refill</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="postcardsAdded">Postcards Added</Label>
            <Input
              id="postcardsAdded"
              type="number"
              min={0}
              placeholder="e.g. 100"
              {...register("postcardsAdded", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Number of new postcards loaded into the machine
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-xl font-semibold text-thai-gold">
                ฿{formatCurrency(calculations.revenue)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Coins Count</p>
              <p className="text-xl font-semibold">
                {debouncedValues.machineCoins10baht || 0}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Postcards Sold</p>
              <p className="text-xl font-semibold">
                {calculations.postcardsSold}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="postcardsRemaining">Postcards Remaining</Label>
              <Input
                id="postcardsRemaining"
                type="number"
                min={0}
                placeholder="e.g. 50"
                {...register("postcardsRemaining", { valueAsNumber: true })}
              />
              {errors.postcardsRemaining && (
                <p className="text-sm text-destructive">
                  {errors.postcardsRemaining.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerPostcard">Cost per Postcard</Label>
              <Input
                id="costPerPostcard"
                type="number"
                step="0.001"
                min={1}
                max={50}
                {...register("costPerPostcard", { valueAsNumber: true })}
              />
              {errors.costPerPostcard && (
                <p className="text-sm text-destructive">
                  {errors.costPerPostcard.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this collection..."
              {...register("notes")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Collection"
          )}
        </Button>
      </div>
    </form>
  );
}
