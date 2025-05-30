import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

const HeroSection: React.FC = () => {
  const sectionRef = useRef(null)

  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'] 
  })

  const y = useTransform(scrollYProgress, [0.1, 0.5], ['-50px', '500px'])
  const scale = useTransform(scrollYProgress, [0.1, 0.5], [1, 0.8])
  const x = useTransform(scrollYProgress, [0.1, 0.5], ['0px', '-250px'])

  const textOpacity = useTransform(scrollYProgress, [0.4, 0.5], [0, 1])
  const textY = useTransform(scrollYProgress, [0.3, 0.4], [100, 240])


  const textX = useTransform(scrollYProgress, [0.3, 0.5], [600, 400])

  // useTemplate from motion/react


  return (
    <div ref={sectionRef} className="relative flex flex-col items-center text-center ">
      <div className="lg:mt-20 mt-10">
        <h1 className="font-bold text-6xl tracking-tighter">Find your Exchange</h1>
        <h4 className="font-semibold text-2xl tracking-wider mt-2">Quick &amp; Easy</h4>
      </div>

      <motion.div className="lg:h-[1000px] relative w-full">
        <motion.img
          src="/sharing.svg"
          alt="Sharing Logo"
          style={{ y, scale, x }}
          className="lg:absolute left-1/2 top-20 -translate-x-1/2 w-96 hidden lg:block"
        />

        <img src="/sharing.svg" alt="Sharing Logo" className="w-[260px] mx-auto lg:hidden" />

        <motion.div
          style={{ x : textX, opacity: textOpacity, y: textY }}
          className="lg:absolute bottom-[50%] right-[52%] hidden lg:block"
        >
          <h2 className="text-3xl font-semibold">Have unused Subscriptions?</h2>
          <p className="mt-2 text-lg text-gray-600">Sell them quick to others.</p>
        </motion.div>

        <div className="text-center lg:hidden mt-10">
          <h2 className="text-3xl font-semibold">Have unused Subscriptions?</h2>
          <p className="mt-2 text-lg text-gray-600">Sell them quick to others.</p>
        </div>
      </motion.div>
    </div>
  )
}

export default HeroSection
