import { Skeleton, SkeletonPage } from "@/components/ui/Skeleton";

export default function FoodsLoading() {
  return (
    <SkeletonPage>
      <h1 className="text-3xl font-semibold text-heading">Foods</h1>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 w-32" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}
