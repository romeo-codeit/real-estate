import { Skeleton } from "@/components/ui/skeleton";

const CryptoCardSkeletonLoader = () => {
  return (
    <div className="max-w-sm bg-card shadow-xl rounded-2xl p-6 border border-border">
      {/* Apply the animate-pulse class to the main container */}
      <div className="space-y-4">
        {/* Header Section Skeleton */}
        <div className="flex justify-between items-start">
          {/* Token Info Skeleton */}
          <div className="flex items-center space-x-3">
            {/* Token Symbol Box Skeleton */}
            <Skeleton className="h-8 w-12 rounded-lg" />
            <div>
              {/* Token Name Skeleton */}
              <Skeleton className="h-5 w-24 rounded mb-1" />
              {/* Price Skeleton */}
              <Skeleton className="h-4 w-12 rounded" />
            </div>
          </div>

          {/* Star Icon Placeholder */}
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2 pt-2">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-3/4 rounded" />
        </div>

        {/* Stats List Skeleton */}
        <div className="space-y-4 pt-4">
          {/* 24h Change Skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>

          {/* Expected ROI Skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>

          {/* Risk Level Skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          {/* Separator Line Placeholder */}
          <div className="border-t border-border pt-4 space-y-4">
            {/* Min. Investment Skeleton */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-10 rounded" />
            </div>

            {/* Market Cap Skeleton */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
          </div>
        </div>

        {/* Invest Now Button Skeleton */}
        <div className="mt-8 pt-4">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default CryptoCardSkeletonLoader;
