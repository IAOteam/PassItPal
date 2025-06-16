// frontend/src/components/pages/landing/CategoryTabs.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const categories = [
  { name: 'Fitness', value: 'GYM_MEMBERSHIP' },
  { name: 'Events', value: 'EVENT_TICKET' },
  { name: 'Courses', value: 'ONLINE_COURSE' },
  { name: 'Trending Now', value: 'trending' }, // 'trending' can be a special filter on the backend
  { name: 'Short-Term Passes', value: 'short-term' }, // Another potential special filter
];

const CategoryTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState(categories[0].name);
  const navigate = useNavigate();

  const handleTabClick = (categoryName: string, categoryValue: string) => {
    setActiveTab(categoryName);
    // Navigate to the listings page with the selected category as a query parameter
    navigate(`/listings?category=${categoryValue}`);
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 flex justify-center">
      <div className="flex space-x-4 md:space-x-8 overflow-x-auto px-4">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => handleTabClick(category.name, category.value)}
            className={cn(
              'py-4 px-2 text-sm md:text-base font-semibold whitespace-nowrap border-b-2 transition-colors duration-200 focus:outline-none',
              activeTab === category.name
                ? 'text-white border-white'
                : 'text-neutral-400 border-transparent hover:text-white hover:border-neutral-500'
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;