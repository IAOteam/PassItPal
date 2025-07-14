// HomePage.tsx
import React, { useRef } from "react";
import HeroSection from "@/components/pages/landing/HeroSection";
// import CategoryTabs from "@/components/pages/landing/CategoryTabs";
import FeaturedContent from "./FeaturedContent";
import TrendingListings from "@/components/listings/TrendingListings";
import HowItWorks from "./HowItWorks";
import Testimonials from "./Testimonials";
import Achievements from "./Achievements";

const HomePage: React.FC = () => {
  const categoryRef = useRef<HTMLDivElement | null>(null);

  return (
    <div>
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
      <Testimonials />
    </div>
  );
};

export default HomePage;
