import { getFoods } from "@/lib/actions/food";
import { FoodListingClient } from "./food-listing-client";

export default async function FoodListingPage() {
  const { foods } = await getFoods();

  const serializedFoods = foods.map((food) => ({
    id: food.id,
    name: food.name,
    category: food.category as "BREAKFAST" | "LUNCH" | "DESSERT" | "SNACK",
    isActive: food.isActive,
  }));

  return <FoodListingClient initialFoods={serializedFoods} />;
}
