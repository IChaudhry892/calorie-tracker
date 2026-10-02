import { EmptyState } from "@/components/ui/EmptyState";

// Placeholder: diet tables arrive in Phase 8.
export default function DietsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-heading">Diets</h1>
      <EmptyState title="No diets yet" text="Diet plans built from your food list are coming soon." />
    </div>
  );
}
