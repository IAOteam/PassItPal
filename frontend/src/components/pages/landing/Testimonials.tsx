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
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=2561&auto=format&fit=crop"
  },
  {
    quote: "I found an amazing deal on a 6-month yoga pass that I couldn't find anywhere else. The 'Scam Shield' feature made me feel secure throughout the process.",
    name: "Rohan Mehra",
    role: "Buyer",
    city: "Mumbai",
    rating: 5,
    imageUrl: "https://images.unsplash.com/photo-1624561172888-ac93c690e10c?q=80&w=2592&auto=format&fit=crop"
  },
  {
    quote: "The direct chat with the seller was super helpful. I could ask all my questions before committing. The whole experience was smooth and transparent.",
    name: "Anjali Singh",
    role: "Buyer",
    city: "Delhi",
    rating: 4,
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=2576&auto=format&fit=crop"
  }
];

const Testimonials: React.FC = () => {
  return (
    <div className="bg-neutral-950 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Trusted by a Growing Community</h2>
          <p className="text-neutral-400 mt-3 md:text-lg">
            Here's what our users have to say about their experience on Passitpal.
          </p>
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-neutral-900 p-8 rounded-xl border border-neutral-800 flex flex-col">
              <div className="flex mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={cn(
                      i < testimonial.rating ? 'text-yellow-400' : 'text-neutral-600'
                    )}
                    fill={i < testimonial.rating ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <blockquote className="text-neutral-200 flex-grow">"{testimonial.quote}"</blockquote>
              <div className="mt-6 flex items-center">
                <Avatar src={testimonial.imageUrl} icon={<UserOutlined />} size={40} />
                <div className="ml-4">
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-neutral-400 text-sm">{testimonial.role} from {testimonial.city}</p>
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