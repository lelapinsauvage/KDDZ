import { z } from "zod";

export const FOOD_CATEGORIES = [
  "BREAKFAST",
  "LUNCH",
  "DESSERT",
  "SNACK",
] as const;

export const foodItemSchema = z.object({
  name: z.string().min(1, "Food name is required").max(100),
  category: z.enum(FOOD_CATEGORIES, {
    message: "Category is required",
  }),
  isActive: z.boolean().default(true),
});

export type FoodItemFormValues = z.infer<typeof foodItemSchema>;
