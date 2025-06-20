import React from 'react';

const ListingCardSkeleton: React.FC = () => {
  return (
    <div className="border border-neutral-800 bg-neutral-900 shadow rounded-lg p-4 w-full">
      <div className="animate-pulse flex flex-col space-y-4">
        {/* Image Placeholder */}
        <div className="bg-neutral-700 h-48 rounded-md"></div>
        {/* Text Placeholders */}
        <div className="space-y-2">
          <div className="bg-neutral-700 h-4 rounded w-3/4"></div>
          <div className="bg-neutral-700 h-4 rounded w-1/2"></div>
        </div>
         {/* Footer Placeholder */}
        <div className="flex justify-between items-center pt-4">
            <div className="bg-neutral-700 h-6 rounded w-1/3"></div>
            <div className="flex items-center gap-2">
                <div className="bg-neutral-700 rounded-full h-6 w-6"></div>
                <div className="bg-neutral-700 h-4 rounded w-16"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCardSkeleton;
