const CryptoCardSkeletonLoader = () => {
  return (
    <div className="max-w-sm bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
      {/* Apply the animate-pulse class to the main container */}
      <div className="animate-pulse space-y-4">
        {/* Header Section Skeleton */}
        <div className="flex justify-between items-start">
          {/* Token Info Skeleton */}
          <div className="flex items-center space-x-3">
            {/* Token Symbol Box Skeleton */}
            <div className="h-8 w-12 bg-gray-200 rounded-lg"></div>
            <div>
              {/* Token Name Skeleton */}
              <div className="h-5 w-24 bg-gray-200 rounded"></div>
              {/* Price Skeleton */}
              <div className="h-4 w-12 mt-1 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Star Icon Placeholder */}
          <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full bg-gray-200 rounded"></div>
          <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
        </div>

        {/* Stats List Skeleton */}
        <div className="space-y-4 pt-4">
          {/* 24h Change Skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
          </div>

          {/* Expected ROI Skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
          </div>

          {/* Risk Level Skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
          </div>

          {/* Separator Line Placeholder */}
          <div className="border-t border-gray-100 pt-4 space-y-4">
            {/* Min. Investment Skeleton */}
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
              <div className="h-4 w-10 bg-gray-200 rounded"></div>
            </div>

            {/* Market Cap Skeleton */}
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        {/* Invest Now Button Skeleton */}
        <div className="mt-8 pt-4">
          <div className="h-12 w-full bg-gray-300 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

export default CryptoCardSkeletonLoader;
