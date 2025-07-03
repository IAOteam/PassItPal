import React from 'react';

const ListingCardSkeleton: React.FC = () => {
  return (
    <div className="group relative overflow-hidden rounded-lg shadow-md bg-neutral-100 dark:bg-neutral-900  flex flex-col">
      {/* Image Skeleton */}
      <div className="h-48 w-full bg-gray-300 dark:bg-neutral-700 animate-pulse" />

      {/* Content Skeleton */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between">
          <div className="space-y-2 w-2/3">
            <div className="h-5 bg-gray-300 dark:bg-neutral-800 p-2 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-300 dark:bg-neutral-800 p-2 rounded w-1/2 mt-2 animate-pulse" />
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="h-3 bg-gray-300 dark:bg-neutral-800 p-2 rounded w-16 animate-pulse" />
            <div className="h-5 bg-gray-300 dark:bg-neutral-800 p-2 rounded w-20 animate-pulse" />
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-neutral-800 animate-pulse" />
            <div className="h-3 bg-gray-300 dark:bg-neutral-800 p-2 rounded w-20 animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 bg-gray-300 dark:bg-neutral-800 p-2 rounded w-12 animate-pulse" />
          </div>
        </div>

        {/* Buttons Skeleton */}
        <div className="flex justify-around mt-6 gap-4">
          <div className="h-8 w-28 bg-gray-300 dark:bg-neutral-800 p-2 rounded-md animate-pulse" />
          <div className="h-8 w-32 bg-gray-300 dark:bg-neutral-800 p-2 rounded-md animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default ListingCardSkeleton;