// frontend/src/components/footer/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Linkedin, ShieldAlert } from 'lucide-react';

const Footer: React.FC = () => {
  const categoryLinks = [
    { name: 'Fitness & Gyms', href: '/listings?category=GYM_MEMBERSHIP' },
    { name: 'Events & Concerts', href: '/listings?category=EVENT_TICKET' },
    { name: 'Courses & Workshops', href: '/listings?category=ONLINE_COURSE' },
  ];

  const companyLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Blog & Safety Alerts', href: '/blog' },
    { name: 'Contact Us', href: '/contact' },
  ];

  const legalLinks = [
    { name: 'Help Center (FAQ)', href: '/help' },
    { name: 'Terms & Conditions', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
  ];

  const socialLinks = [
    { name: 'Twitter', icon: <Twitter size={20} />, href: '#' },
    { name: 'Instagram', icon: <Instagram size={20} />, href: '#' },
    { name: 'LinkedIn', icon: <Linkedin size={20} />, href: '#' },
  ];

  return (
    <footer className="dark:bg-black dark:text-white">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
                <span className="text-xl font-bold">Passitpal</span>
            </Link>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              The trusted marketplace for buying and selling passes, tickets, and subscriptions securely.
            </p>
          </div>

          {/* Categories Column */}
          <div>
            <h3 className="font-semibold tracking-wider uppercase text-neutral-900 dark:text-neutral-300">Categories</h3>
            <ul className="mt-4 space-y-2">
              {categoryLinks.map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="text-neutral-700 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold tracking-wider uppercase text-neutral-900 dark:text-neutral-300">Company</h3>
            <ul className="mt-4 space-y-2">
              {companyLinks.map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="text-neutral-700 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Support Column */}
          <div>
            <h3 className="font-semibold tracking-wider uppercase text-neutral-900 dark:text-neutral-300">Support</h3>
            <ul className="mt-4 space-y-2">
              {legalLinks.map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="text-neutral-700 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Passitpal. All Rights Reserved.
          </p>
          <div className="flex space-x-4">
            {socialLinks.map(social => (
              <a key={social.name} href={social.href} className="hover:text-black text-neutral-500 dark:hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                <span className="sr-only">{social.name}</span>
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;