"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createFood } from "@/lib/actions/food";

// ── Types ───────────────────────────────────────
type FoodCategory = "BREAKFAST" | "LUNCH" | "DESSERT" | "SNACK";

interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  isActive: boolean;
}

// ── Category helpers ────────────────────────────
const categoryColors: Record<FoodCategory, string> = {
  BREAKFAST: "bg-blue-100 text-blue-700 border-blue-200",
  LUNCH: "bg-green-100 text-green-700 border-green-200",
  DESSERT: "bg-pink-100 text-pink-700 border-pink-200",
  SNACK: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const categoryLabels: Record<FoodCategory, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DESSERT: "Dessert",
  SNACK: "Snack",
};

// ── Column definitions ──────────────────────────
const foodColumns: ColumnDef<FoodItem>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 text-xs font-semibold uppercase"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-[#333]">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 text-xs font-semibold uppercase"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Category
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const cat = row.original.category;
      return (
        <Badge className={categoryColors[cat]}>
          {categoryLabels[cat]}
        </Badge>
      );
    },
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue || filterValue === "ALL") return true;
      return row.original.category === filterValue;
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 text-xs font-semibold uppercase"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const active = row.original.isActive;
      return (
        <Badge
          className={
            active
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-gray-100 text-gray-600 border-gray-200"
          }
        >
          {active ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const food = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                console.log("Edit food:", food.id);
              }}
            >
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                console.log("Delete food:", food.id);
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];

// ── Props ───────────────────────────────────────
interface FoodListingClientProps {
  initialFoods: FoodItem[];
}

// ── Page Component ──────────────────────────────
export function FoodListingClient({ initialFoods }: FoodListingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Add-food form state
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<FoodCategory>("BREAKFAST");
  const [newActive, setNewActive] = useState(true);

  const filteredItems = useMemo(() => {
    if (categoryFilter === "ALL") return initialFoods;
    return initialFoods.filter((f) => f.category === categoryFilter);
  }, [initialFoods, categoryFilter]);

  async function handleAdd() {
    if (!newName.trim()) return;

    const result = await createFood({
      name: newName.trim(),
      category: newCategory,
      isActive: newActive,
    });

    if (result.success) {
      setNewName("");
      setNewCategory("BREAKFAST");
      setNewActive(true);
      setDialogOpen(false);
      startTransition(() => {
        router.refresh();
      });
    }
  }

  return (
    <>
      <PageHeader
        title="Food Listing"
        breadcrumbs={[
          { label: "Food Management", href: "/food" },
          { label: "Food Listing" },
        ]}
      />

      <div className="space-y-4 p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="BREAKFAST">Breakfast</SelectItem>
              <SelectItem value="LUNCH">Lunch</SelectItem>
              <SelectItem value="DESSERT">Dessert</SelectItem>
              <SelectItem value="SNACK">Snack</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          {/* Add Food button */}
          <Button
            className="bg-[#1caf9a] text-white hover:bg-[#18a08d]"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-1 size-4" />
            Add Food
          </Button>
        </div>

        {/* Data Table */}
        {filteredItems.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">No food items found.</p>
          </div>
        ) : (
          <DataTable columns={foodColumns} data={filteredItems} searchKey="name" searchPlaceholder="Search food items..." />
        )}
      </div>

      {/* Add Food Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Food Item</DialogTitle>
            <DialogDescription>
              Add a new food item to the menu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="food-name">Name</Label>
              <Input
                id="food-name"
                placeholder="e.g. Labne"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newCategory}
                onValueChange={(v) => setNewCategory(v as FoodCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="DESSERT">Dessert</SelectItem>
                  <SelectItem value="SNACK">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="food-active"
                checked={newActive}
                onCheckedChange={(checked) => setNewActive(checked === true)}
              />
              <Label htmlFor="food-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              style={{ background: "#1caf9a" }}
              className="text-white"
              onClick={handleAdd}
              disabled={!newName.trim() || isPending}
            >
              {isPending ? "Adding..." : "Add Food"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
