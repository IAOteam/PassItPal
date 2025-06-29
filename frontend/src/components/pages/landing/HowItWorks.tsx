// frontend/src/components/pages/landing/HowItWorks.tsx
import React from 'react';
import { Search, ShieldCheck, PartyPopper } from 'lucide-react';

const steps = [
  {
    icon: <Search size={40} className="dark:text-white" />,
    title: 'Find or List a Pass',
    description: 'Effortlessly browse for the pass you need using our advanced filters, or list your unused pass for sale in just a few minutes.',
  },
  {
    icon: <ShieldCheck size={40} className="dark:text-white" />,
    title: 'Connect & Transact Securely',
    description: 'Chat directly and safely with users. All payments are held by our "Scam Shield" escrow until the pass is successfully transferred.',
  },
  {
    icon: <PartyPopper size={40} className="dark:text-white" />,
    title: 'Verify & Enjoy',
    description: 'The buyer verifies the pass with the provider, and with a click, the funds are released to the seller. A win-win for everyone!',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <div className="bg-white dark:bg-neutral-900 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold dark:text-white">Simple, Safe, and Secure</h2>
          <p className="text-neutral-700 dark:text-neutral-400  mt-3 md:text-lg">
            Our platform is designed to make buying and selling passes completely hassle-free.
            Follow these three easy steps.
          </p>
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center p-6 bg-gray-200 dark:bg-neutral-950 rounded-xl border border-gray-300 dark:border-neutral-800 transform hover:-translate-y-2 transition-transform duration-300">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-purple-400 mx-auto mb-6">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2">{step.title}</h3>
              <p className="text-neutral-700 dark:text-neutral-400 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;