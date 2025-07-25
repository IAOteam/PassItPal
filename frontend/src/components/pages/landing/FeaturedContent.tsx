// frontend/src/components/pages/landing/FeaturedContent.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

// We'll create these pages in the next steps
const featuredItems = [
  {
    title: 'How Passitpal Works',
    description: 'Understand our simple and secure process in three easy steps.',
    imageUrl: 'https://placehold.co/400x600/a3e635/172754?text=How+It+Works',
    link: '/how-it-works',
  },
  {
    title: 'Your Safety, Our Priority',
    description: 'Learn how to transact securely with our comprehensive safety guide.',
    imageUrl: 'https://placehold.co/400x600/67e8f9/172754?text=Safety+Guide',
    link: '/safety-guide',
  },
  {
    title: 'Explore Top Categories',
    description: 'From gym passes to concert tickets, find exactly what you need.',
    imageUrl: 'https://placehold.co/400x600/f9a8d4/172754?text=Top+Categories',
    link: '/listings',
  },
  {
    title: 'Become a Seller Today',
    description: 'Have an unused pass? List it in minutes and earn cash securely.',
    imageUrl: 'https://placehold.co/400x600/fde047/172754?text=Become+a+Seller',
    link: '/seller/create-listing', // This will redirect to login if not authenticated
  },
  {
    title: 'From the Blog',
    description: 'Get tips, news, and updates from the Passitpal team.',
    imageUrl: 'https://placehold.co/400x600/fdba74/172754?text=Our+Blog',
    link: '/blog',
  },
];

const FeaturedContent: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="py-12 md:py-16 bg-gray-100 dark:bg-neutral-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">Discover More</h2>
        
        {/* ---  SIDE-SCROLLING CONTAINER --- */}
        <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featuredItems.map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.link)}
              className="group flex-shrink-0 w-72 md:w-80 cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg shadow-lg">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-96 w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 dark:text-white"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="text-lg text-white font-bold leading-tight">{item.title}</h3>
                  <p className="text-gray-300 text-sm mt-1">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedContent;