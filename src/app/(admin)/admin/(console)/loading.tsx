import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function ConsoleLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton shape="pill" className="h-8 w-24" />
        <Skeleton className="h-8 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
