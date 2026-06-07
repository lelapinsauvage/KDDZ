import { getFoods } from "@/lib/actions/food";
import {
  FoodListingClient,
  type FoodItem,
} from "@/components/food/food-listing-client";

export default async function FoodListingPage() {
  const { foods } = await getFoods();

  const sortedFoods = [...foods].sort((a, b) => {
    const dateDiff = b.createdAt.getTime() - a.createdAt.getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.name.localeCompare(b.name);
  });

  const serializedFoods: FoodItem[] = sortedFoods.map((food, index) => ({
    id: food.id,
    rowNumber: String(food.legacyId ?? index + 1),
    legacyId: food.legacyId,
    name: food.name,
    category: food.category as FoodItem["category"],
    isActive: food.isActive,
    createdAt: food.createdAt.toISOString(),
  }));

  return <FoodListingClient initialFoods={serializedFoods} />;
}
