import { FoodsPlaceholder } from "./FoodsPlaceholder";

// Placeholder: the food list arrives in Phase 6.
export default function FoodsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-heading">Foods</h1>
      <FoodsPlaceholder />
    </div>
  );
}
