import React from 'react'

import { motion, useScroll, useTransform } from 'motion/react';
const HeroSection: React.FC = () => {
  const { scrollYProgress } = useScroll();

  
  const y = useTransform(scrollYProgress, [0.1, 0.8], ['-100px', '100px']);
  const scale = useTransform(scrollYProgress, [0.2, 0.5], [1, 0.8]);
  const x = useTransform(scrollYProgress, [0.2, 0.8], ['0px', '-300px']);


  const textOpacity = useTransform(scrollYProgress, [0.5, 0.7], [0, 1]);
  const textX = useTransform(scrollYProgress, [0.5, 0.7], ['100px', '0px']);

  return (
    <div className="flex flex-col items-center text-center relative">
      <div className="lg:mt-20 mt-10">
        <h1 className="font-bold text-6xl tracking-tighter">Find your Exchange</h1>
        <h4 className="font-semibold text-2xl tracking-wider mt-2">Quick &amp; Easy</h4>
      </div>

      <motion.div className="lg:h-[100vh] relative w-full">
        <motion.img
          src="/sharing.svg"
          alt="Sharing Logo"
          style={{ y, scale, x }}
          className="lg:absolute left-1/2 top-20 -translate-x-1/2 w-96 hidden lg:block"
        />

        <img src="/sharing.svg" alt="Sharing Logo" className="w-[260px]  mx-auto lg:hidden" />

        <motion.div
          style={{ opacity: textOpacity, x: textX }}
          className="lg:absolute lg:top-[40%] lg:left-[50%]  lg:text-left text-center mt-10"
        >
          <h2 className="text-3xl font-semibold">Have unused Subscriptions?</h2>
          <p className="mt-2 text-lg text-gray-600">Sell them qucik  to others.</p>


        </motion.div>
      </motion.div>
    </div>
  )
}

export default HeroSection;