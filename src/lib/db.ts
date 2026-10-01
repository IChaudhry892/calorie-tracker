import type { Tables } from "@/lib/database.types";

export type Profile = Tables<"profiles">;
export type Food = Tables<"foods">;
export type Diet = Tables<"diets">;
export type DietItem = Tables<"diet_items">;
export type LogEntry = Tables<"log_entries">;
