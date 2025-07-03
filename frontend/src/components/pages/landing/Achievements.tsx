import React, { useEffect, useState } from 'react'
import { Handshake, TrendingUp, Users } from 'lucide-react';
import api from '@/lib/api';


const Achievements: React.FC = () => {
  const [stats, setStats] = useState({
    activeListings: '2,450+',
    moneySaved: '₹1.2L+',
    successfulDeals: '5,600+',
  });

  useEffect(() => {
    api.get('/listings/stats/public').then(res => {
      const { activeListings, moneySaved, successfulDeals } = res.data;
      setStats({
        activeListings: activeListings.toLocaleString('en-IN'),
        moneySaved: `₹${(moneySaved / 1000).toFixed(1)}k+`, // Format as 'k' or 'L' as you prefer
        successfulDeals: successfulDeals.toLocaleString('en-IN'),
      });
    }).catch(console.error);
  }, []);

  const achievementsItems=[
    {
        icon: <Users/>,
        figure: stats.activeListings,
        title: "Active Listings"
    },
    {
        icon: <TrendingUp/>,
        figure: stats.moneySaved,
        title: "Money Saved"
    },
    {
        icon: <Handshake/>,
        figure: stats.successfulDeals,
        title: "Successful Deals"
    }
]

  return (
    <div className='flex justify-evenly pb-4 bg-gradient-to-b from-blue-300 to-violet-300 '>
        {
            achievementsItems.map((achievement, index) =>(
                <div key={index} className="text-center p-6">
                    <div className='flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mx-auto mb-2 shadow-lg drop-shadow-lg text-purple-500'>{achievement.icon}</div>
                    <div className="text-xl font-bold pl-2 dark:text-white">{achievement.figure}</div>
                    <div className="text-neutral-800 dark:text-white text-sm pl-1">{achievement.title}</div>
                </div>
            ))
        }
    </div>
  )
}

export default Achievements