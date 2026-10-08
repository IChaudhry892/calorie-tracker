import { Skeleton, SkeletonPage } from "@/components/ui/Skeleton";

export default function DietsLoading() {
  return (
    <SkeletonPage>
      <h1 className="text-3xl font-semibold text-heading">Diets</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}
