import { Skeleton, SkeletonPage } from "@/components/ui/Skeleton";

export default function CalculatorLoading() {
  return (
    <SkeletonPage>
      <h1 className="text-3xl font-semibold text-heading">Calorie Calculator</h1>
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-36 rounded-2xl" />
    </SkeletonPage>
  );
}
