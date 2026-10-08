import { Skeleton, SkeletonPage } from "@/components/ui/Skeleton";

export default function DietLoading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-9 w-64 max-w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </SkeletonPage>
  );
}
