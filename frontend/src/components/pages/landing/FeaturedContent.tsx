// frontend/src/components/pages/landing/FeaturedContent.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const featuredItems = [
  {
    title: 'Exclusive Discounts on Premium Passes',
    description: 'Limited-time offers on top-rated gyms and events.',
    imageUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=2669&auto=format&fit=crop',
    link: '/listings?sortBy=price_asc',
  },
  {
    title: 'See What Our Users Say',
    description: 'Read reviews and testimonials from our vibrant community.',
    imageUrl: 'https://images.unsplash.com/photo-1549476464-373922117533?q=80&w=2574&auto=format&fit=crop',
    link: '/reviews', // We will create this page later
  },
  {
    title: 'Explore New Categories',
    description: 'Discover new fitness options, courses, and local events.',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2720&auto=format&fit=crop',
    link: '/listings',
  },
  {
    title: 'Become a Seller Today',
    description: 'Have an unused pass? List it in minutes and earn.',
    imageUrl: 'https://images.unsplash.com/photo-1517130038641-a774d04afb3c?q=80&w=2670&auto=format&fit=crop',
    link: '/profile',
  },
];

const FeaturedContent: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-neutral-900 py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Scrollable Container */}
        <div className="flex space-x-6 overflow-x-auto pb-4 [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featuredItems.map((item) => (
            <div
              key={item.title}
              className="group flex-shrink-0 w-72 md:w-80 cursor-pointer"
              onClick={() => navigate(item.link)}
            >
              <div className="overflow-hidden rounded-xl">
                <div
                  className="h-48 w-full bg-center bg-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                />
              </div>
              <div className="mt-4">
                <h3 className="text-white text-lg font-bold leading-tight">{item.title}</h3>
                <p className="text-neutral-400 text-sm mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedContent;