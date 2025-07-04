// frontend/src/pages/BlogPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';

const blogPosts = [
  {
    slug: '5-tips-for-safe-transactions',
    title: '5 Essential Tips for Safe Transactions on Marketplaces',
    snippet: 'Your safety is our priority. Before you make your next deal, read our top tips for verifying items and ensuring a smooth, secure transaction.',
    category: 'Safety',
    imageUrl: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2574&auto=format&fit=crop',
    author: 'The Passitpal Team',
    date: 'July 2, 2025',
  },
  {
    slug: 'how-to-sell-your-gym-pass',
    title: 'The Ultimate Guide to Selling Your Unused Gym Membership',
    snippet: 'Plans change, but your money shouldn\'t go to waste. Here\'s a step-by-step guide on how to list your gym pass effectively on Passitpal.',
    category: 'Selling Tips',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2670&auto=format&fit=crop',
    author: 'The Passitpal Team',
    date: 'June 28, 2025',
  },
  // Add more placeholder blog posts here
];

const BlogPage: React.FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-neutral-950 py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold dark:text-white">From the Passitpal Blog</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-3">Tips, updates, and stories from our community.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link to={`/blog/${post.slug}`} key={post.slug} className="group block bg-white dark:bg-neutral-900 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="overflow-hidden rounded-t-lg">
                <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">{post.category}</p>
                <h2 className="text-xl font-bold dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{post.title}</h2>
                <p className="text-neutral-600 dark:text-neutral-300 text-sm mb-4">{post.snippet}</p>
                <p className="text-xs text-neutral-500">{post.author} • {post.date}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;