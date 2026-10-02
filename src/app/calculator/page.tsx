import { EmptyState } from "@/components/ui/EmptyState";

// Placeholder: the BMR/TDEE calculator arrives in Phase 5.
export default function CalculatorPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-heading">Calculator</h1>
      <EmptyState title="Coming soon" text="Work out your maintenance calories from your age, height, weight and activity level." />
    </div>
  );
}
