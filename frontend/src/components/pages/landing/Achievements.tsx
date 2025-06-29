import React from 'react'
import { Handshake, TrendingUp, Users } from 'lucide-react';

const achievementsItems=[
    {
        icon: <Users/>,
        figure: "2,450+",
        title: "Active Listings"
    },
    {
        icon: <TrendingUp/>,
        figure: "₹1.2L+",
        title: "Money Saved"
    },
    {
        icon: <Handshake/>,
        figure: "5,600+",
        title: "Successful Deals"
    }
]
const Achievements : React.FC = () => {
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