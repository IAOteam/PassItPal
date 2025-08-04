// frontend/src/components/pages/landing/HomePage.tsx

import React, { useRef } from "react";
import HeroSection from "@/components/pages/landing/HeroSection";
// import CategoryTabs from "@/components/pages/landing/CategoryTabs"; 
import FeaturedContent from "./FeaturedContent";
import TrendingListings from "@/components/listings/TrendingListings";
import HowItWorks from "./HowItWorks";
import Testimonials from "./Testimonials";
import Achievements from "./Achievements";
import { Helmet } from 'react-helmet-async'; // Kept from HEAD for SEO
import FAQ from "./FAQs";

const HomePage: React.FC = () => {
  const categoryRef = useRef<HTMLDivElement | null>(null);

  return (
    <div>
      <Helmet>
        <title>Passitpal | Buy & Sell Unused Passes and Subscriptions</title>
        <meta name="description" content="Discover amazing deals on gym passes, event tickets, and digital subscriptions near you. Securely sell your unused passes on India's trusted marketplace." />
      </Helmet>
      <HeroSection
        scrollToCategory={() =>
          categoryRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      />
      <div ref={categoryRef}>
        {/* <CategoryTabs /> */}
        <FeaturedContent />
      </div>
      <TrendingListings />
      <Achievements />
      <HowItWorks />
      {/* <Testimonials /> */}
      <FAQ/>
    </div>
  );
};

export default HomePage;