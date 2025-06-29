// frontend/src/pages/landing/HomePage.tsx
import React from 'react';
import HeroSection from '@/components/pages/landing/HeroSection';
import CategoryTabs from '@/components/pages/landing/CategoryTabs';
import FeaturedContent from './FeaturedContent';
import TrendingListings from '@/components/listings/TrendingListings';
import HowItWorks from './HowItWorks';
import Testimonials from './Testimonials';
import Achievements from './Achievements';

const HomePage: React.FC = () => {
  return (
    <div>
      <HeroSection />
      <CategoryTabs />
      <FeaturedContent />
      <TrendingListings />
      <Achievements />
      <HowItWorks />
      <Testimonials />
      {/* The new "Featured Content" section will go here next */}
    </div>
  );
};

export default HomePage;