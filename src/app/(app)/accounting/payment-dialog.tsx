"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPayment, updatePayment } from "@/lib/actions/payments";

// ── Types ──

interface ChildOption {
  id: string;
  firstName: string;
  lastName: string;
  branch: { name: string } | null;
  class: { name: string } | null;
}

interface EditData {
  id: string;
  childId: string;
  childName: string;
  amount: number;
  currency: string;
  date: string;
  dateFrom: string | null;
  dateTo: string | null;
  month: number | null;
  method: string;
  category: string;
  status: string;
  reference: string | null;
  notes: string | null;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childrenList: ChildOption[];
  editData?: EditData | null;
}

const monthOptions = [
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
];

export function PaymentDialog({
  open,
  onOpenChange,
  childrenList,
  editData,
}: PaymentDialogProps) {
  const isEditing = !!editData;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [childId, setChildId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [month, setMonth] = useState("NONE");
  const [method, setMethod] = useState("CASH");
  const [category, setCategory] = useState("MONTHLY");
  const [status, setStatus] = useState("PAID");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [childSearch, setChildSearch] = useState("");

  function resetForm() {
    setChildId("");
    setAmount("");
    setCurrency("USD");
    setDate(new Date().toISOString().split("T")[0]);
    setDateFrom("");
    setDateTo("");
    setMonth("NONE");
    setMethod("CASH");
    setCategory("MONTHLY");
    setStatus("PAID");
    setReference("");
    setNotes("");
    setError(null);
    setChildSearch("");
  }

  // Populate form when editing — syncing dialog state from props is a
  // legitimate pattern that requires setting state inside an effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editData) {
      setChildId(editData.childId);
      setAmount(editData.amount.toString());
      setCurrency(editData.currency);
      setDate(editData.date);
      setDateFrom(editData.dateFrom ?? "");
      setDateTo(editData.dateTo ?? "");
      setMonth(editData.month ? editData.month.toString() : "NONE");
      setMethod(editData.method);
      setCategory(editData.category);
      setStatus(editData.status);
      setReference(editData.reference ?? "");
      setNotes(editData.notes ?? "");
    } else {
      resetForm();
    }
  }, [editData, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSubmit() {
    setError(null);

    if (!childId) {
      setError("Please select a child");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!date) {
      setError("Please enter a date");
      return;
    }

    startTransition(async () => {
      const payload = {
        childId,
        amount: Number(amount),
        currency,
        date,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        month: month !== "NONE" ? Number(month) : null,
        method: method as "CASH" | "CHECK" | "TRANSFER" | "CREDIT_CARD",
        category: category as "REGISTRATION" | "MONTHLY" | "BUS" | "XTRA_TIME" | "FOOD" | "OTHER",
        status: status as "PAID" | "PENDING" | "OVERDUE",
        reference: reference || null,
        notes: notes || null,
      };

      let result;
      if (isEditing && editData) {
        result = await updatePayment(editData.id, payload);
      } else {
        result = await createPayment(payload);
      }

      if (result.success) {
        onOpenChange(false);
        resetForm();
      } else {
        setError(result.error ?? "Failed to save payment");
      }
    });
  }

  const filteredChildren = childSearch
    ? childrenList.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(childSearch.toLowerCase()),
      )
    : childrenList;

  const selectedChild = childrenList.find((c) => c.id === childId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Update Payment" : "New Payment"}
            {selectedChild && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                for {selectedChild.firstName} {selectedChild.lastName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Child Selector */}
          <div className="space-y-2">
            <Label>Child *</Label>
            {!isEditing ? (
              <div className="space-y-2">
                <Input
                  placeholder="Search child..."
                  value={childSearch}
                  onChange={(e) => setChildSearch(e.target.value)}
                />
                <Select value={childId} onValueChange={setChildId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a child" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {filteredChildren.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                        {c.branch && (
                          <span className="text-muted-foreground"> — {c.branch.name}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Input
                value={editData?.childName ?? ""}
                disabled
                className="bg-muted"
              />
            )}
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>Payment Amount *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
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

          {/* Method + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHECK">Cheque</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fees Type</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGISTRATION">Registration Fees</SelectItem>
                  <SelectItem value="MONTHLY">Monthly Fees</SelectItem>
                  <SelectItem value="XTRA_TIME">Xtra-Time Fees</SelectItem>
                  <SelectItem value="BUS">Bus Fees</SelectItem>
                  <SelectItem value="FOOD">Food Fees</SelectItem>
                  <SelectItem value="OTHER">Other Fees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes if needed"
            />
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Date Range (From / To) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Month */}
          <div className="space-y-2">
            <Label>Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Select Month</SelectItem>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Receipt Number */}
          <div className="space-y-2">
            <Label>Receipt Number</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Receipt #"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Close
            </Button>
            <Button
             
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending
                ? isEditing
                  ? "Updating..."
                  : "Saving..."
                : isEditing
                  ? "Update"
                  : "Proceed"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
