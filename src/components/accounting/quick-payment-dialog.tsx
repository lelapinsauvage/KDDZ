"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Banknote,
  CreditCard,
  ArrowLeftRight,
  Receipt,
  Check,
  ChevronsUpDown,
  MessageSquare,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { recordPayment } from "@/lib/actions/payments";
import {
  quickPaymentSchema,
  type QuickPaymentInput,
} from "@/lib/validations/payments";

// ── Types ──

interface ChildOption {
  id: string;
  firstName: string;
  lastName: string;
  branch: { name: string } | null;
  class: { name: string } | null;
}

interface QuickPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childrenList: ChildOption[];
  preselectedChildId?: string;
}

// ── Constants ──

const paymentMethods = [
  { value: "CASH" as const, label: "Cash", icon: Banknote },
  { value: "CHECK" as const, label: "Check", icon: Receipt },
  { value: "TRANSFER" as const, label: "Transfer", icon: ArrowLeftRight },
  { value: "CREDIT_CARD" as const, label: "Card", icon: CreditCard },
];

const categories = [
  { value: "MONTHLY" as const, label: "Monthly" },
  { value: "REGISTRATION" as const, label: "Registration" },
  { value: "BUS" as const, label: "Bus" },
  { value: "FOOD" as const, label: "Food" },
  { value: "XTRA_TIME" as const, label: "Extra Time" },
  { value: "OTHER" as const, label: "Other" },
];

// ── Component ──

export function QuickPaymentDialog({
  open,
  onOpenChange,
  childrenList,
  preselectedChildId,
}: QuickPaymentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<QuickPaymentInput>({
    resolver: zodResolver(quickPaymentSchema),
    defaultValues: {
      childId: preselectedChildId ?? "",
      amount: undefined,
      method: "CASH",
      category: "MONTHLY",
      notes: "",
    },
  });

  const selectedChildId = watch("childId");
  const selectedMethod = watch("method");
  const selectedCategory = watch("category");

  const selectedChild = childrenList.find((c) => c.id === selectedChildId);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        childId: preselectedChildId ?? "",
        amount: undefined,
        method: "CASH",
        category: "MONTHLY",
        notes: "",
      });
      setShowNotes(false);
    }
  }, [open, preselectedChildId, reset]);

  function onSubmit(data: QuickPaymentInput) {
    startTransition(async () => {
      const result = await recordPayment(data);
      if (result.success && result.data) {
        toast.success(
          `Payment of $${data.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} recorded for ${result.data.childName}`,
        );
        // Reset for next payment (stay open for batch)
        reset({
          childId: "",
          amount: undefined,
          method: "CASH",
          category: "MONTHLY",
          notes: "",
        });
        setShowNotes(false);
        // Focus amount field if child will be re-selected, otherwise let them pick child
      } else {
        toast.error(result.error ?? "Failed to record payment");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Record Payment</SheetTitle>
          <SheetDescription>
            Quick payment recording — stays open for batch entry.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 px-4 pb-4"
        >
          {/* ── Child Selector (Combobox) ── */}
          <div className="space-y-2">
            <Label>Child</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between font-normal"
                  autoFocus
                >
                  {selectedChild
                    ? `${selectedChild.firstName} ${selectedChild.lastName}`
                    : "Search child..."}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Type a name..." />
                  <CommandList>
                    <CommandEmpty>No child found.</CommandEmpty>
                    <CommandGroup>
                      {childrenList.map((child) => (
                        <CommandItem
                          key={child.id}
                          value={`${child.firstName} ${child.lastName}`}
                          onSelect={() => {
                            setValue("childId", child.id, { shouldValidate: true });
                            setComboboxOpen(false);
                            // Focus amount after selection
                            setTimeout(() => amountRef.current?.focus(), 50);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              selectedChildId === child.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {child.firstName} {child.lastName}
                            </span>
                            {(child.branch || child.class) && (
                              <span className="text-xs text-muted-foreground">
                                {[child.branch?.name, child.class?.name]
                                  .filter(Boolean)
                                  .join(" / ")}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.childId && (
              <p className="text-xs text-destructive">{errors.childId.message}</p>
            )}
          </div>

          {/* ── Amount ── */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 font-semibold">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-7 text-lg font-semibold tabular-nums text-foreground"
                {...register("amount", { valueAsNumber: true })}
                ref={(e) => {
                  register("amount", { valueAsNumber: true }).ref(e);
                  (amountRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                }}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* ── Payment Method (Icon Buttons) ── */}
          <div className="space-y-2">
            <Label>Method</Label>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMethod === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setValue("method", m.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-xs font-medium transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-muted bg-muted/30 text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50",
                    )}
                  >
                    <Icon className="size-5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Category (Quick Select Pills) ── */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setValue("category", cat.value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/20 bg-muted/30 text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/50",
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Notes (collapsed by default) ── */}
          {!showNotes ? (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
            >
              <MessageSquare className="size-4" />
              Add a note
            </button>
          ) : (
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes..."
                rows={2}
                {...register("notes")}
              />
            </div>
          )}

          {/* ── Submit ── */}
          <Button
            type="submit"
            size="lg"
            className="w-full mt-2"
            disabled={isPending}
          >
            {isPending ? "Recording..." : "Record Payment"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
