import { Skeleton, SkeletonPage } from "@/components/ui/Skeleton";

export default function LogLoading() {
  return (
    <SkeletonPage>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-11 w-64 max-w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-17" />
          ))}
        </div>
        <Skeleton className="h-5 w-56" />
      </div>
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-3 rounded-full" />
    </SkeletonPage>
  );
}
