import { useEffect, useState } from 'react';
import { getListings } from '@/api';
import type { Listing } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import {
    Mail, Phone, User, MapPin, CalendarDays, BadgeIndianRupee
  } from 'lucide-react';
  

 const PassListing = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filtered, setFiltered] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [selected, setSelected] = useState<Listing | null>(null);

  useEffect(() => {
    getListings()
      .then((data) => {
        setListings(data.listings);
        setFiltered(data.listings);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    let result = listings;

    if (search) {
      result = result.filter((l) =>
        l.cultPassType.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (cityFilter !== 'all') {
      result = result.filter((l) => l.city.toLowerCase() === cityFilter.toLowerCase());
    }

    setFiltered(result);
  }, [search, cityFilter, listings]);

  const uniqueCities = Array.from(new Set(listings.map((l) => l.city)));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
    <h1 className="text-2xl font-semibold text-center mb-6">Browse Cult Passes</h1>

    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <input
        type="text"
        placeholder="Search by pass type..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
      />
      <select
        value={cityFilter}
        onChange={(e) => setCityFilter(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-md"
      >
        <option value="all">All Cities</option>
        {uniqueCities.map((city) => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>
    </div>

    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
      {filtered.map((listing) => (
        <motion.div
          key={listing._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setSelected(listing)}
          className="cursor-pointer rounded-lg shadow-md border border-gray-200 overflow-hidden bg-white hover:shadow-lg transition-shadow"
        >
          <img
            src={listing.adImageUrl}
            alt={listing.cultPassType}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h2 className="font-semibold text-lg">{listing.cultPassType}</h2>
            <p className="text-sm text-gray-600">City: {listing.city}</p>
            <p className="text-sm text-gray-600">Credits: {listing.availableCredits}</p>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-green-600 font-semibold">₹{listing.askingPrice}</span>
              {listing.isPromoted && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                  Promoted
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>

    <AnimatePresence>
  {selected && (
    <motion.div
      key="modal"
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setSelected(null)}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={selected.adImageUrl}
          alt={selected.cultPassType}
          className="w-full h-40 object-cover rounded-md mb-4"
        />

        <h2 className="text-xl font-semibold mb-3 text-center">
          {selected.cultPassType}
        </h2>

        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span>{selected.seller.username}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <span>{selected.seller.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <span>{selected.seller.mobileNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span>{selected.city}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-500" />
            <span>
              Expiry: {new Date(selected.expiryDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BadgeIndianRupee className="w-4 h-4 text-gray-500" />
            <span>
              ₹{selected.askingPrice} &nbsp;
              <span className="line-through text-gray-400">
                ₹{selected.originalPrice}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">Available Credits:</span>
            <span>{selected.availableCredits}</span>
          </div>
        </div>

        <button
          onClick={() => setSelected(null)}
          className="mt-6 w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
  </div>
  );
};

export default PassListing;