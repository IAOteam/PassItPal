import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CookieConsentProps {
  onAccept: () => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // If no consent is stored, show the banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
    onAccept(); // Callback to initialize analytics
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'false');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "100%" }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-[100] w-auto max-w-lg"
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl p-5 flex flex-col md:flex-row items-center gap-4">
            <Cookie className="h-10 w-10 text-sky-400 flex-shrink-0 hidden md:block" />
            <div className="text-sm text-neutral-300 flex-grow">
              <p>
                We use cookies to enhance your experience and analyze site traffic. By clicking "Accept", you agree to our use of cookies for analytics.
                Learn more in our <Link to="/privacy" className="underline hover:text-white">Privacy Policy</Link>.
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleDecline} className="flex-1 md:flex-initial">Decline</Button>
              <Button size="sm" onClick={handleAccept} className="flex-1 md:flex-initial">Accept</Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
