"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
  Loader2,
  UtensilsCrossed,
  CalendarDays,
  Coffee,
  Soup,
  Cake,
  Cookie,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { FOOD_CATEGORY_COLORS } from "@/lib/food-colors";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────
type FoodCategory = "BREAKFAST" | "LUNCH" | "DESSERT" | "SNACK";

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  isActive: boolean;
  createdAt: string;
}

// ── Category helpers ────────────────────────────
const categoryLabels: Record<FoodCategory, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DESSERT: "Dessert",
  SNACK: "Snack",
};

const categoryIcons: Record<FoodCategory, { icon: typeof Coffee }> = {
  BREAKFAST: { icon: Coffee },
  LUNCH: { icon: Soup },
  DESSERT: { icon: Cake },
  SNACK: { icon: Cookie },
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

  // Stats
  const totalItems = initialFoods.length;
  const categoryCounts = useMemo(() => {
    const counts: Record<FoodCategory, number> = {
      BREAKFAST: 0,
      LUNCH: 0,
      DESSERT: 0,
      SNACK: 0,
    };
    for (const f of initialFoods) {
      counts[f.category]++;
    }
    return counts;
  }, [initialFoods]);

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

  const openEdit = useCallback((food: FoodItem) => {
    setDialogMode("edit");
    setEditingId(food.id);
    setFormName(food.name);
    setFormCategory(food.category);
    setFormActive(food.isActive);
    setDialogOpen(true);
  }, []);

  const openDelete = useCallback((food: FoodItem) => {
    setDeletingItem(food);
    setDeleteDialogOpen(true);
  }, []);

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
          toast.success(`"${formName.trim()}" has been added`);
          setDialogOpen(false);
          router.refresh();
        } else {
          toast.error(result.error ?? "Failed to create food item");
        }
      } else if (editingId) {
        const result = await updateFood(editingId, {
          name: formName.trim(),
          category: formCategory,
          isActive: formActive,
        });
        if (result.success) {
          toast.success(`"${formName.trim()}" has been updated`);
          setDialogOpen(false);
          router.refresh();
        } else {
          toast.error(result.error ?? "Failed to update food item");
        }
      }
    });
  }

  function handleDelete() {
    if (!deletingItem) return;

    startTransition(async () => {
      const result = await deleteFood(deletingItem.id);
      if (result.success) {
        toast.success(`"${deletingItem.name}" has been deleted`);
        setDeleteDialogOpen(false);
        setDeletingItem(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete food item");
      }
    });
  }

  // ── Column definitions ──
  const foodColumns: ColumnDef<FoodItem>[] = useMemo(
    () => [
      {
        accessorKey: "category",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Type
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const cat = row.original.category;
          const colors = FOOD_CATEGORY_COLORS[cat];
          return (
            <Badge className={`${colors.bg} ${colors.text}`}>
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
          <span className="font-medium text-foreground">
            {row.original.name}
          </span>
        ),
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
            Active
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const active = row.original.isActive;
          return (
            <Badge
              className={
                active
                  ? "bg-[#008200] text-white border-transparent"
                  : "bg-[#d64635] text-white border-transparent"
              }
            >
              {active ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created Date
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const val = row.original.createdAt;
          if (!val) return <span className="text-muted-foreground">—</span>;
          const d = new Date(val);
          return (
            <span className="text-sm text-muted-foreground">
              {isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB")}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const food = row.original;
          return (
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="sm" className="size-8 p-0" onClick={() => openEdit(food)}>
                <Pencil className="size-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => openDelete(food)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [openEdit, openDelete]
  );

  return (
    <>
      <PageHeader
        title="Food Items"
        breadcrumbs={[
          { label: "Food", href: "/food" },
          { label: "Items" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/food/calendar">
              <Button variant="outline">
                <CalendarDays className="mr-1 size-4" />
                Calendar
              </Button>
            </Link>
            <Button onClick={openAdd}>
              <Plus className="mr-1 size-4" />
              Add Food
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              { cat: "BREAKFAST" as FoodCategory, label: "Breakfast" },
              { cat: "LUNCH" as FoodCategory, label: "Lunch" },
              { cat: "DESSERT" as FoodCategory, label: "Dessert" },
              { cat: "SNACK" as FoodCategory, label: "Snack" },
            ] as const
          ).map(({ cat, label }) => {
            const { icon: Icon } = categoryIcons[cat];
            const colors = FOOD_CATEGORY_COLORS[cat];
            return (
              <Card
                key={cat}
                className="rounded-sm py-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                onClick={() =>
                  setCategoryFilter(categoryFilter === cat ? "ALL" : cat)
                }
              >
                <CardContent className="flex items-center gap-4">
                  <div
                    className={`flex size-10 items-center justify-center rounded-sm ${colors.bg}`}
                  >
                    <Icon className={`size-5 ${colors.text}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {categoryCounts[cat]}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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

          <div className="ml-auto text-sm text-muted-foreground">
            {filteredItems.length} of {totalItems} items
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No food items found"
            description="Add food items to build your nursery menu and track meals."
          />
        ) : (
          <DataTable
            columns={foodColumns}
            data={filteredItems}
            searchKey="name"
            searchPlaceholder="Search food items..."
          />
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
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
