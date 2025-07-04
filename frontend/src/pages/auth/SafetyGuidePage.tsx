import React from 'react';
import { ShieldCheck, MessageSquare, Banknote, Search, UserCheck } from 'lucide-react';

const SafetyGuidePage: React.FC = () => {
  return (
    <div className="bg-white dark:bg-black py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center max-w-3xl mx-auto">
          <ShieldCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold dark:text-white">Your Safety, Our Priority</h1>
          <p className="text-neutral-700 dark:text-neutral-300 mt-4 md:text-lg">
            Passitpal is a marketplace that connects you with other people. While most users are trustworthy, it's important to take smart precautions. Follow this guide for a safe and secure experience.
          </p>
        </div>

        <div className="mt-16 space-y-8">
          <div className="flex items-start gap-4">
            <Search className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold dark:text-white mb-2">Verify Before You Buy</h3>
              <p className="text-neutral-600 dark:text-neutral-400">This is the most important rule. Before sending any money, contact the original company (the gym, event organizer, software provider) with the pass or ticket details from the seller. Confirm that the pass is valid, transferable, and has the benefits the seller claims. A legitimate seller will have no problem with you doing this.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <MessageSquare className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold dark:text-white mb-2">Keep Communication On-Platform</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Use the Passitpal chat for all communication. Scammers often try to move the conversation to other apps like WhatsApp or Telegram to avoid leaving a digital trail. Keeping your chat here helps us investigate if something goes wrong.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Banknote className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold dark:text-white mb-2">Handle Payments Wisely</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Arrange for payment directly with the seller only after you have fully verified the item. Never share personal financial details like your bank account number or credit card information in the chat. Use secure, reputable payment methods.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <UserCheck className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold dark:text-white mb-2">Check the Seller's Reputation</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Always click on the seller's profile to check their average rating and read reviews from other users. A history of positive feedback is a great sign of a trustworthy seller.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyGuidePage;