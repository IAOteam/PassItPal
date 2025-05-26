import React from 'react'


const HeroSection : React.FC= () => {
  return (
    <div className='flex flex-col items-center  h-screen text-center relative'>
        <div className='mt-20'>
            <h1 className='font-bold text-6xl tracking-tighter'>Find you're Exchange</h1>
            <h4 className='font-semibold text-2xl tracking-wider mt-2'>Quick &amp; Easy</h4>
        </div>
        <div>
            <img src="/sharing.svg" alt="Sharing Logo" className='absolute -translate-x-1/2   w-96' />
            
        </div>

    </div>
  )
}

export default HeroSection