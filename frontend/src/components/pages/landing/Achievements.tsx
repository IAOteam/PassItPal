import React, { useEffect, useState } from 'react'
import { Handshake, TrendingUp, Users } from 'lucide-react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

//  function that fetches your data
const fetchPublicStats = async () => {
  const { data } = await api.get('/listings/stats/public');
  return data;
};
const Achievements: React.FC = () => {

  // the hook to fetch and manage the data
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['publicStats'], // A unique key for this data
    queryFn: fetchPublicStats,
    staleTime: 1000 * 60 * 5, //  Cache data for 5 minutes
  });
   //  the returned state to render your UI
  if (isLoading) return <div>Loading Achievements...</div>; //  loading state
  if (isError) return null; // Or show an error message


  const achievementsItems=[
    {
        icon: <Users/>,
        figure: (stats.activeListings || 0).toLocaleString('en-IN'),
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