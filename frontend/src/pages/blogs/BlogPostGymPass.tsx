import React from 'react';

const BlogPostGymPass: React.FC = () => {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <h1 className="text-4xl font-bold mb-2">The Ultimate Guide to Selling Your Unused Gym Membership</h1>
      <p className="text-muted-foreground mb-6">By The Passitpal Team • June 28, 2025</p>
      <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2670&auto=format&fit=crop" alt="Gym" className="w-full h-80 object-cover rounded-lg mb-8" />
      <div className="prose dark:prose-invert max-w-none">
        <h2>Why Sell Your Pass?</h2>
        <p>Life is unpredictable. Maybe you moved to a new city, your work schedule changed, or you found a new fitness passion. Whatever the reason, your pre-paid gym membership shouldn't become a sunk cost...</p>
        
      </div>
    </div>
  );
};

export default BlogPostGymPass;