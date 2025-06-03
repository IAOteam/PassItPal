// frontend/src/pages/ListingsPage.tsx
import React from 'react';
import { useSearchParams } from 'react-router-dom';

const ListingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const locationName = searchParams.get('locationName');

  return (
    <div className="container mx-auto p-4 min-h-[calc(100vh-150px)]">
      <h1 className="text-3xl font-bold mb-6">Listings</h1>
      {locationName ? (
        <p className="text-xl">
          Showing listings for: <span className="font-semibold">{locationName}</span>
        </p>
      ) : (
        <p className="text-xl">Browse all listings.</p>
      )}
      {/* Placeholder for actual listing items */}
      <div className="mt-6">
        <p className="text-gray-500">(Listing items will appear here soon...)</p>
      </div>
    </div>
  );
};

export default ListingsPage;