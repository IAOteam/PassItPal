import React from 'react';

const BlogPostSafetyTips: React.FC = () => {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <h1 className="text-4xl font-bold mb-2">5 Essential Tips for Safe Transactions on Marketplaces</h1>
      <p className="text-muted-foreground mb-6">By The Passitpal Team • July 2, 2025</p>
      <img src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2574&auto=format&fit=crop" alt="Safe transaction" className="w-full h-80 object-cover rounded-lg mb-8" />
      <div className="prose dark:prose-invert max-w-none">
        <p>Your safety is our priority. Before you make your next deal, read our top tips for verifying items and ensuring a smooth, secure transaction...</p>
        
      </div>
    </div>
  );
};

export default BlogPostSafetyTips;