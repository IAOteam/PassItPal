// frontend/src/pages/HowItWorksPage.tsx

import React from 'react';
import { Search, ShieldCheck, PartyPopper, MessageSquare, Banknote } from 'lucide-react';
import { BackButton } from '@/components/shared/BackButton';

const steps = [
  {
    icon: <Search size={32} />,
    title: '1. Find or List a Pass',
    description: 'For Buyers: Use our powerful search and filters to find the exact pass, ticket, or coupon you need. For Sellers: Click "List a Pass", fill in the details in under two minutes, and your listing is live!',
  },
  {
    icon: <MessageSquare size={32} />,
    title: '2. Connect Securely via Chat',
    description: 'Use our built-in, secure chat to ask the seller questions, confirm details, and agree on the final price. Keeping communication on our platform helps us protect you.',
  },
  {
    icon: <ShieldCheck size={32} />,
    title: '3. Verify Before You Pay',
    description: 'This is the most important step. Before making any payment, contact the original service provider (the gym, event organizer, etc.) with the pass details provided by the seller to confirm its validity and transferability.',
  },
  {
    icon: <Banknote size={32} />,
    title: '4. Transact Directly',
    description: 'Once you are satisfied, arrange payment directly with the seller using a secure method of your choice. Passitpal does not handle the payment between users, giving you flexibility and control.',
  },
  {
    icon: <PartyPopper size={32} />,
    title: '5. Enjoy & Leave a Review!',
    description: 'Once the pass is transferred, you\'re all set to enjoy your new experience! Don\'t forget to leave a review for the seller to help build trust within the community.',
  },
];

const HowItWorksPage: React.FC = () => {
  return (
    <div className="bg-white dark:bg-black py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <BackButton />
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold dark:text-white">Simple, Safe, and Secure</h1>
          <p className="text-neutral-700 dark:text-neutral-300 mt-4 md:text-lg">
            Our platform is designed to make buying and selling passes completely hassle-free. Here’s a detailed look at our five-step process.
          </p>
        </div>

        <div className="mt-16 space-y-12">
          {steps.map((step) => (
            <div key={step.title} className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-300">
                {step.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold dark:text-white mb-2">{step.title}</h3>
                <p className="text-neutral-700 dark:text-neutral-300 text-base">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;