import { Skeleton } from "@/components/ui/skeleton";

export const FeatureCardSkeleton = () => (
  <div className="card-elevated rounded-2xl overflow-hidden h-full">
    <div className="p-8 h-full flex flex-col">
      <Skeleton className="w-14 h-14 rounded-2xl mb-6" />
      <Skeleton className="h-6 w-3/4 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-6" />
      <Skeleton className="h-4 w-1/3 mt-auto" />
    </div>
  </div>
);

export const ActivityItemSkeleton = () => (
  <div className="flex items-center p-6 card-elevated rounded-xl">
    <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
    <div className="ml-6 flex-1 min-w-0">
      <Skeleton className="h-5 w-1/2 mb-2" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
    <Skeleton className="w-3 h-3 rounded-full ml-auto" />
  </div>
);

export const DashboardHeaderSkeleton = () => (
  <div className="flex justify-between items-center">
    <div>
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-5 w-48" />
    </div>
    <div className="flex items-center space-x-4">
      <div className="text-right hidden sm:block">
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center space-x-4 p-4">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-3 w-1/3" />
    </div>
    <Skeleton className="h-8 w-20" />
  </div>
);

export const StatCardSkeleton = () => (
  <div className="card-elevated rounded-xl p-6">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-16 mb-2" />
    <Skeleton className="h-3 w-20" />
  </div>
);
