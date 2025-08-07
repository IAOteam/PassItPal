// frontend/src/components/pages/landing/HowItWorks.tsx

import React, { useState, useEffect } from "react";
import { Timeline } from "antd";
import {
  SearchOutlined,
  WifiOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";


const testimonials = [
  {
    quote: "Selling my extra gym pass was surprisingly easy and fast. The platform is intuitive and I got paid as soon as the buyer confirmed. Highly recommended!",
    name: "Priya Sharma",
    role: "Seller",
    city: "Bengaluru",
    rating: 5,
    imageUrl: "https://placehold.co/100x100/fecaca/991b1b?text=PS"
  },
  {
    quote: "I found an amazing deal on a 6-month yoga pass that I couldn't find anywhere else. The 'Scam Shield' feature made me feel secure throughout the process.",
    name: "Rohan Mehra",
    role: "Buyer",
    city: "Mumbai",
    rating: 5,
    imageUrl: "https://placehold.co/100x100/c7d2fe/1e3a8a?text=RM"
  },
  {
    quote: "The direct chat with the seller was super helpful. I could ask all my questions before committing. The whole experience was smooth and transparent.",
    name: "Anjali Singh",
    role: "Buyer",
    city: "Delhi",
    rating: 4,
    imageUrl: "https://placehold.co/100x100/bbf7d0/166534?text=AS"
  }
];
const HowItWorks: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const { name, quote, role } = testimonials[index];

  return (
    <section className="bg-white dark:bg-neutral-900 py-16 md:py-24 pagePadding">
      {/* GRID SPLIT */}
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto gap-14 items-center">
        {/* LEFT: How it Works */}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold dark:text-white mb-3">
            Simple, Safe, Secure
          </h2>
          <p className="content-secondary text-lg mb-6 w-3/4">
            Exchange passes instantly—no hassle, total peace of mind. Here’s how it works:
          </p>
          <Timeline
            className="ml-4"
            
            items={[
              {
                dot: (
                  <span className="flex items-center justify-center h-9 w-9 rounded-full bg-violet-100 dark:bg-violet-600 translate-y-1">
                    <SearchOutlined className="text-violet-600 dark:text-white text-2xl" />
                  </span>
                ),
                children: (
                  <div className="ml-3 h-16">
                    <div className="text-xl font-semibold mb-0.5">
                      Find/List Pass
                    </div>
                    <div className="content-secondary text-sm">
                      Use filters or list your unused pass—in seconds.
                    </div>
                  </div>
                ),
              },
              {
                dot: (
                  <span className="flex items-center justify-center h-9 w-9 rounded-full bg-green-100 dark:bg-green-700 translate-y-1">
                    <WifiOutlined className="text-green-600 dark:text-white text-2xl" />
                  </span>
                ),
                children: (
                  <div className="ml-3 h-16">
                    <div className="text-lg font-semibold mb-0.5">
                      Connect & Secure Transaction
                    </div>
                    <div className="content-secondary text-sm">
                      Chat directly; funds held safe in escrow.
                    </div>
                  </div>
                ),
              },
              {
                dot: (
                  <span className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-700 translate-y-1">
                    <CheckCircleOutlined className="text-blue-600 dark:text-white text-2xl " />
                  </span>
                ),
                children: (
                  <div className="ml-3">
                    <div className="text-lg font-semibold mb-0.5">
                      Verify & Enjoy
                    </div>
                    <div className="content-secondary text-sm">
                      Once verified, seller is paid—everyone wins.
                    </div>
                  </div>
                ),
              },
            ]}
            // Use Ant’s timeline but style as super minimal
            style={{
              background: "none",
              paddingLeft: 0,
              marginTop: 24,
            }}
          />
        </div>
        {/* RIGHT: Testimonial Carousel */}
        <div className="relative flex flex-col items-center">
          <div
            className="w-full max-w-sm rounded-xl shadow-xl bg-gradient-to-br from-violet-50 via-white to-violet-100
              dark:bg-neutral-800 dark:from-neutral-900 dark:to-neutral-800
              p-6 md:p-8
              min-h-[190px] flex flex-col justify-center items-center
              transition-all"
            style={{
              boxShadow:
                "0 2px 20px 0 rgba(92,58,255,.04), 0 1.5px 6px 0 rgba(92,58,255,.06)",
            }}
          >
            {/* Avatar with initial */}
            <div className="flex items-center mb-3">
              <span className="flex items-center justify-center h-12 w-12 rounded-full bg-violet-300 dark:bg-violet-600 text-white text-2xl font-bold mr-3">
                {name[0]}
              </span>
              <div>
              <h4 className="font-medium text-gray-900 dark:text-white text-base">{name}</h4>
              <h4>{role}</h4>
              </div>
            </div>
            {/* Quotation */}
            <div className="text-neutral-700 dark:text-violet-100 text-lg italic leading-[1.6] text-center px-2">
              <span className="text-2xl text-violet-400 mr-1">“</span>
              {quote}
              <span className="text-2xl text-violet-400 ml-1">”</span>
            </div>
            {/* Dots */}
            <div className="flex gap-1.5 justify-center mt-5">
              {testimonials.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-5 rounded-full transition-all duration-200 ${
                    i === index
                      ? "bg-violet-500"
                      : "bg-neutral-300 dark:bg-neutral-700"
                  }`}
                  style={{
                    opacity: i === index ? 1 : 0.4,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
