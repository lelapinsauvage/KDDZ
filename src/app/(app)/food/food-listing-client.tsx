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
  Loader2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createFood, updateFood, deleteFood } from "@/lib/actions/food";

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

// ── Props ───────────────────────────────────────
interface FoodListingClientProps {
  initialFoods: FoodItem[];
}

// ── Page Component ──────────────────────────────
export function FoodListingClient({ initialFoods }: FoodListingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<FoodCategory>("BREAKFAST");
  const [formActive, setFormActive] = useState(true);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<FoodItem | null>(null);

  const filteredItems = useMemo(() => {
    if (categoryFilter === "ALL") return initialFoods;
    return initialFoods.filter((f) => f.category === categoryFilter);
  }, [initialFoods, categoryFilter]);

  function openAdd() {
    setDialogMode("add");
    setEditingId(null);
    setFormName("");
    setFormCategory("BREAKFAST");
    setFormActive(true);
    setDialogOpen(true);
  }

  function openEdit(food: FoodItem) {
    setDialogMode("edit");
    setEditingId(food.id);
    setFormName(food.name);
    setFormCategory(food.category);
    setFormActive(food.isActive);
    setDialogOpen(true);
  }

  function openDelete(food: FoodItem) {
    setDeletingItem(food);
    setDeleteDialogOpen(true);
  }

  function handleSave() {
    if (!formName.trim()) return;

    startTransition(async () => {
      if (dialogMode === "add") {
        const result = await createFood({
          name: formName.trim(),
          category: formCategory,
          isActive: formActive,
        });
        if (result.success) {
          setDialogOpen(false);
          router.refresh();
        }
      } else if (editingId) {
        const result = await updateFood(editingId, {
          name: formName.trim(),
          category: formCategory,
          isActive: formActive,
        });
        if (result.success) {
          setDialogOpen(false);
          router.refresh();
        }
      }
    });
  }

  function handleDelete() {
    if (!deletingItem) return;

    startTransition(async () => {
      const result = await deleteFood(deletingItem.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setDeletingItem(null);
        router.refresh();
      }
    });
  }

  // ── Column definitions (inside component for handler access) ──
  const foodColumns: ColumnDef<FoodItem>[] = useMemo(
    () => [
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
                <DropdownMenuItem onClick={() => openEdit(food)}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => openDelete(food)}
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
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

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

          <Button
            className="bg-[#1caf9a] text-white hover:bg-[#18a08d]"
            onClick={openAdd}
          >
            <Plus className="mr-1 size-4" />
            Add Food
          </Button>
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">No food items found.</p>
          </div>
        ) : (
          <DataTable columns={foodColumns} data={filteredItems} searchKey="name" searchPlaceholder="Search food items..." />
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Add Food Item" : "Edit Food Item"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "add"
                ? "Add a new food item to the menu."
                : "Update this food item."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="food-name">Name</Label>
              <Input
                id="food-name"
                placeholder="e.g. Labne"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formCategory}
                onValueChange={(v) => setFormCategory(v as FoodCategory)}
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
                checked={formActive}
                onCheckedChange={(checked) => setFormActive(checked === true)}
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
              onClick={handleSave}
              disabled={!formName.trim() || isPending}
            >
              {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
              {dialogMode === "add" ? "Add Food" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Food Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
