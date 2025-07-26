import React, { useEffect, useState, type ReactNode } from 'react'
import { Handshake, TrendingUp, Users } from 'lucide-react'
import { motion, useAnimation, AnimatePresence } from 'motion/react'
import api from '@/lib/api'

interface AchievementCardProps {
  icon: ReactNode;
  figure: string;
  title: string;
  delay?: number;
}

const AchievementCard : React.FC<AchievementCardProps> = ({ icon, figure, title, delay = 0 }) => {
  const controls = useAnimation()

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, delay },
    })
  }, [controls, delay])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={controls}
      whileHover={{ y : -5}}
      
      className="w-full sm:w-64 p-6 bg-white/80 dark:bg-neutral-900/80  rounded-xl flex flex-col items-center gap-3
         bento-grid"
      
    >
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 dark:bg-primary/15 mb-1 text-primary text-2xl shadow-sm">
        {icon}
      </div>
      <h3 className="text-3xl font-extrabold tracking-tight text-primary">
        {figure}
      </h3>
      <p className="text-neutral-600 dark:text-neutral-300 text-sm font-medium">{title}</p>
    </motion.div>
  )
}

const Achievements: React.FC = () => {
  const [stats, setStats] = useState({
    activeListings: '2,450+',
    moneySaved: '₹1.2L+',
    successfulDeals: '5,600+',
  })

  useEffect(() => {
    api.get('/listings/stats/public').then(res => {
      const { activeListings, moneySaved, successfulDeals } = res.data
      setStats({
        activeListings: activeListings.toLocaleString('en-IN'),
        moneySaved: `₹${(moneySaved / 1000).toFixed(1)}k+`,
        successfulDeals: successfulDeals.toLocaleString('en-IN'),
      })
    }).catch(console.error)
  }, [])

  const achievementsItems = [
    {
      icon: <Users />,
      figure: stats.activeListings,
      title: "Active Listings"
    },
    {
      icon: <TrendingUp />,
      figure: stats.moneySaved,
      title: "Money Saved"
    },
    {
      icon: <Handshake />,
      figure: stats.successfulDeals,
      title: "Successful Deals"
    }
  ]

  return (
    <section
      className="py-16 bg-gradient-to-tr from-background via-white/80 dark:via-neutral-900/80 to-primary/5"
    >
      <div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-8">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9, type: "spring", stiffness: 60 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-black text-center text-foreground"
        >
          The Impact We&apos;ve Created
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.7 }}
          className="text-base md:text-lg text-center text-neutral-600 dark:text-neutral-300 max-w-xl mb-4"
        >
          Every deal on our platform saves resources—money, time, and the planet. Here’s what our community has achieved together.
        </motion.p>

        <div className="flex flex-col sm:flex-row gap-7 w-full justify-center items-center">
          {achievementsItems.map((achievement, i) => (
            <AchievementCard
              key={achievement.title}
              icon={achievement.icon}
              figure={achievement.figure}
              title={achievement.title}
              delay={i * 0.9}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Achievements
