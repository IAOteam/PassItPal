"use client"

import React, { useRef } from "react";
import HeroSection from "./HeroSection";
// import CategoryTabs from "@/components/pages/landing/CategoryTabs"; 
import FeaturedContent from "./FeaturedContent";

import HowItWorks from "./HowItWorks";
import FAQ from "./FAQs";

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
      <HowItWorks />
      {/* <Testimonials /> */}
      <FAQ/>
    </div>
  );
};

export default HomePage;