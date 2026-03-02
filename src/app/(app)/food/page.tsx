import { getFoods } from "@/lib/actions/food";
import {
  FoodListingClient,
  type FoodItem,
} from "@/components/food/food-listing-client";

export default async function FoodListingPage() {
  const { foods } = await getFoods();

  const serializedFoods: FoodItem[] = foods.map((food) => ({
    id: food.id,
    name: food.name,
    category: food.category as FoodItem["category"],
    isActive: food.isActive,
    createdAt: food.createdAt.toISOString(),
  }));

  return <FoodListingClient initialFoods={serializedFoods} />;
}
