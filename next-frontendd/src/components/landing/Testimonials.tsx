// frontend/src/components/pages/landing/Testimonials.tsx
import React from 'react';
import { Star } from 'lucide-react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { cn } from '@/lib/utils';

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

const Testimonials: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-blue-400 to-purple-400 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold dark:text-white">Trusted by a Growing Community</h2>
          <p className="text-neutral-700 dark:text-neutral-200 mt-3 md:text-lg">
            Here&apos;s what our users have to say about their experience on Passitpal.
          </p>
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-opacity-40 bg-neutral-300 dark:bg-opacity-70 dark:bg-neutral-900 p-8 rounded-xl flex flex-col">
              <blockquote className="text-neutral-800 dark:text-neutral-200 flex-grow">&ldquo;{testimonial.quote}&ldquo;</blockquote>
              <div className="mt-6 flex justify-between">
                <div className='flex items-center'>
                  <Avatar src={testimonial.imageUrl} icon={<UserOutlined />} size={40} />
                  <div className="ml-4">
                    <p className="font-semibold dark:text-white">{testimonial.name}</p>
                    <p className="text-neutral-700 dark:text-neutral-400 text-sm">{testimonial.role} from {testimonial.city}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={cn(
                        i < testimonial.rating ? 'text-yellow-400' : 'text-neutral-300 dark:text-neutral-600'
                      )}
                      fill={i < testimonial.rating ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;