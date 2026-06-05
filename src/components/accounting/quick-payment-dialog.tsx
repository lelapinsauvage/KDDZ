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
  CalendarDays,
  Upload,
  X,
  FileText,
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
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { recordPayment } from "@/lib/actions/payments";
import { uploadFileWithPresign } from "@/lib/uploads/client-upload";
import {
  quickPaymentSchema,
  type QuickPaymentInput,
} from "@/lib/validations/payments";

// ── Types ──

interface ChildOption {
  id: string;
  childNumber?: string | null;
  firstName: string;
  lastName: string;
  branchId: string;
  branch: { name: string } | null;
  class: { name: string } | null;
}

interface QuickPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childrenList: ChildOption[];
  preselectedChildId?: string;
  preselectedCategory?: string;
  preselectedMonth?: number;
  preselectedYear?: number;
}

// ── Constants ──

const paymentMethods = [
  { value: "CASH" as const, label: "Cash", icon: Banknote },
  { value: "CHECK" as const, label: "Cheque", icon: Receipt },
  { value: "CREDIT_CARD" as const, label: "Credit Card", icon: CreditCard },
  { value: "TRANSFER" as const, label: "Bank Transfer", icon: ArrowLeftRight },
];

const categories = [
  { value: "REGISTRATION" as const, label: "Registration" },
  { value: "MONTHLY" as const, label: "Monthly" },
  { value: "BUS" as const, label: "Bus" },
  { value: "XTRA_TIME" as const, label: "Xtra-Time" },
  { value: "FOOD" as const, label: "Food" },
  { value: "OTHER" as const, label: "Other" },
];

const monthOptions = [
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
];

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCurrentAcademicStartYear() {
  const now = new Date();
  return now.getMonth() + 1 >= 10 ? now.getFullYear() : now.getFullYear() - 1;
}

// ── Component ──

export function QuickPaymentDialog({
  open,
  onOpenChange,
  childrenList,
  preselectedChildId,
  preselectedCategory,
  preselectedMonth,
  preselectedYear,
}: QuickPaymentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      currency: "USD",
      method: "CASH",
      category: (preselectedCategory as QuickPaymentInput["category"]) ?? "MONTHLY",
      notes: "",
      date: toISODate(new Date()),
      coverageFromMonth: preselectedMonth,
      coverageToMonth: preselectedMonth,
      coverageYear: preselectedYear ?? getCurrentAcademicStartYear(),
    },
  });

  const selectedChildId = watch("childId");
  const selectedMethod = watch("method");
  const selectedCategory = watch("category");
  const selectedCurrency = watch("currency");
  const selectedDate = watch("date");
  const coverageFrom = watch("coverageFromMonth");
  const coverageTo = watch("coverageToMonth");

  const selectedChild = childrenList.find((c) => c.id === selectedChildId);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        childId: preselectedChildId ?? "",
        amount: undefined,
        currency: "USD",
        method: "CASH",
        category: (preselectedCategory as QuickPaymentInput["category"]) ?? "MONTHLY",
        notes: "",
        date: toISODate(new Date()),
        coverageFromMonth: preselectedMonth,
        coverageToMonth: preselectedMonth,
        coverageYear: preselectedYear ?? getCurrentAcademicStartYear(),
      });
      setAttachment(null);
    }
  }, [open, preselectedChildId, preselectedCategory, preselectedMonth, preselectedYear, reset]);

  function onSubmit(data: QuickPaymentInput) {
    startTransition(async () => {
      let payload = data;

      if (attachment) {
        if (!selectedChild?.branchId) {
          toast.error("Cannot upload receipt because the child's branch is unavailable");
          return;
        }

        try {
          const uploaded = await uploadFileWithPresign({
            branchId: selectedChild.branchId,
            scope: "payment-receipt",
            ownerId: data.childId,
            file: attachment,
          });
          payload = {
            ...data,
            receiptFilename: attachment.name,
            receiptFileUrl: uploaded.publicUrl,
          };
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to upload receipt",
          );
          return;
        }
      }

      const result = await recordPayment(payload);
      if (result.success && result.data) {
        toast.success(
          `Payment of ${data.currency === "LBP" ? "LL" : "$"}${data.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} recorded for ${result.data.childName}`,
        );
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Failed to record payment");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Record Payment</SheetTitle>
          <SheetDescription>
            Enter payment details below.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 px-4 pb-4"
        >
          <input type="hidden" {...register("coverageYear", { valueAsNumber: true })} />

          {/* ── Child Info ── */}
          <div className="space-y-2">
            <Label>Child</Label>
            {selectedChild ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm">
                  {selectedChild.firstName} {selectedChild.lastName}
                  {selectedChild.childNumber && (
                    <span className="text-muted-foreground ml-1">
                      #{selectedChild.childNumber}
                    </span>
                  )}
                  {selectedChild.branch && (
                    <span className="text-muted-foreground ml-1">
                      — {selectedChild.branch.name}
                    </span>
                  )}
                  {selectedChild.class && (
                    <span className="text-muted-foreground">
                      / {selectedChild.class.name}
                    </span>
                  )}
                </Badge>
                {!preselectedChildId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => setValue("childId", "")}
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
            ) : (
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between font-normal"
                  >
                    Search child...
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
            )}
            {errors.childId && (
              <p className="text-xs text-destructive">{errors.childId.message}</p>
            )}
          </div>

          {/* ── Amount + Currency ── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 font-semibold">
                  {selectedCurrency === "LBP" ? "LL" : "$"}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-8 text-lg font-semibold tabular-nums text-foreground"
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
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={selectedCurrency}
                onValueChange={(v) => setValue("currency", v as "USD" | "LBP")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="LBP">LBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Fee Type (Category Pills) ── */}
          <div className="space-y-2">
            <Label>Fee Type</Label>
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

          {/* ── Payment Method (Icon Radio Group) ── */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
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
                      "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-[11px] font-medium transition-all",
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

          {/* ── Payment Date (Calendar Popover) ── */}
          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarDays className="mr-2 size-4" />
                  {selectedDate
                    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
                  onSelect={(day: Date | undefined) => {
                    if (day) {
                      setValue("date", toISODate(day));
                    }
                    setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* ── Coverage Period ── */}
          <div className="space-y-2">
            <Label>Coverage Period</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={coverageFrom !== undefined ? coverageFrom.toString() : ""}
                onValueChange={(v) => setValue("coverageFromMonth", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="From month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={coverageTo !== undefined ? coverageTo.toString() : ""}
                onValueChange={(v) => setValue("coverageToMonth", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="To month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Add notes if needed..."
              rows={2}
              {...register("notes")}
            />
          </div>

          {/* ── Attachment Dropzone ── */}
          <div className="space-y-2">
            <Label>Attachment</Label>
            {attachment ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                <FileText className="size-5 text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm truncate">{attachment.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  onClick={() => {
                    setAttachment(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) setAttachment(file);
                }}
                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 p-6 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/40"
              >
                <Upload className="size-6" />
                <span>Drop receipt here or click to upload</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setAttachment(file);
              }}
            />
          </div>

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
