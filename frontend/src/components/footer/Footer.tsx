import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  const categoryLinks = [
    { name: 'Fitness & Gyms', href: '/listings?category=GYM_MEMBERSHIP' },
    { name: 'Events & Concerts', href: '/listings?category=EVENT_TICKET' },
    { name: 'Courses & Workshops', href: '/listings?category=ONLINE_COURSE' },
  ];

  const companyLinks = [
    { name: 'Help Center', href: '/help' },
    { name: 'Blog & Safety Alerts', href: '/blog' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Advertise With Us', href: '/advertise' },
  ];

  const socialLinks = [
    { name: 'Twitter', icon: <Twitter size={18} />, href: '#' },
    { name: 'Instagram', icon: <Instagram size={18} />, href: '#' },
    { name: 'LinkedIn', icon: <Linkedin size={18} />, href: '#' },
  ];

  return (
    <footer className="dark:bg-black dark:text-white bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-10">

          <div className='sm:col-span-2'>
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold">Passitpal</span>
            </Link>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed sm:w-2/3">
              The trusted marketplace for buying and selling passes, tickets, and subscriptions.
            </p>

            <div className="flex gap-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="p-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-300 uppercase text-sm tracking-wider">
              Categories
            </h3>
            <ul className="mt-4 space-y-2">
              {categoryLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-neutral-700 hover:text-black dark:text-neutral-400 dark:hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-300 uppercase text-sm tracking-wider">
              Company
            </h3>
            <ul className="mt-4 space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-neutral-700 hover:text-black dark:text-neutral-400 dark:hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-300 uppercase text-sm tracking-wider">
              Stay Updated
            </h3>
            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              Get the latest deals and safety alerts directly in your inbox.
            </p>
            <form className="mt-4 flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 text-sm rounded-l-md border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-r-md hover:bg-blue-700 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-200 dark:border-neutral-800 pt-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-500 w-52 sm:w-full sm:flex gap-1  ">
            &copy; {new Date().getFullYear()} Passitpal. All Rights Reserved. <span className='hidden sm:flex'>|</span>{" "}
            <a href="/privacy" className="hover:underline">Privacy Policy</a> |{" "}
            <a href="/terms" className="hover:underline">Terms & Conditions</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
