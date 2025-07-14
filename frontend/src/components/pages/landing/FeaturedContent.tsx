// frontend/src/components/pages/landing/FeaturedContent.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightIcon, Wrench, Settings, Globe, IndianRupee, LockOpen, Lock, Shapes} from "lucide-react";

const FeaturedContent: React.FC = () => {
  
  return (
    <div className="pagePadding py-10 w-full dark:bg-black dark:text-white ">

      <div className="grid grid-cols-12 gap-2 grid-rows-6 ">
        <div className="px-5 pt-6  pb-10 col-span-7 border bento-grid row-span-2 group hover:shadow-[4.0px_8.0px_8.0px_rgba(0,0,0,0.38)] dark:hover:shadow-[4.0px_8.0px_8.0px_rgba(255,255,255,0.38)]  h-36">
          <h1 className="bento-grid-heading">How it Works?</h1>
          <p className="bento-grid-text">Know how to use Passitpal in easy steps</p>

          
          <Wrench className="absolute top-14 right-12 w-10 h-10  opacity-80"  color="#7C70E0"/>
          <Settings className="absolute top-9 right-20 w-10 h-10 group-hover:animate-slow-spin opacity-85" color="#7C70E0" />
          <LearMore link="/how-it-works"/>
        </div>

        <div className=" col-span-5 border bento-grid row-span-4 group relative overflow-hidden">
          <h1 className="bento-grid-heading "> <span className="text-4xl tracking-wider">Explore</span> </h1>
          <h2 className="text-xl font-medium my-1 bento-grid-text text-black dark:text-white">Top Categories</h2>
          <p className="bento-grid-text z-50">From gym passes to concert tickets, <br/> find exactly what you need.</p>
          <LearMore link="/listings"/>
          <Globe className="absolute -top-10 -right-16 w-52 h-52   -rotate-45 opacity-50 group-hover:opacity-100 group-hover:w-20 group-hover:h-20 group-hover:top-1/2 group-hover:right-10 group-hover:rotate-0 group-hover:animate-slow-bounce transition-all duration-300 ease-in-out" strokeWidth={1} color="#7C70E0" />
        </div>
        <div className=" col-span-4 border bento-grid row-span-4 group">
          <h1 className="bento-grid-heading">Start <br/> Selling</h1>

          <p className="bento-grid-text">Have an unused pass? List it in minutes and earn cash securely.</p>
          <LearMore link="/seller/create-listing"/>

          <IndianRupee className="absolute top-8 left-32 w-10 h-10  opacity-80"  color="#7C70E0"/>
          <IndianRupee className="absolute top-8 left-32 w-10 h-10  opacity-0 group-hover:opacity-85 group-hover:translate-x-8 transition-all duration-300 ease-in-out"  color="#7C70E0"/>
          <IndianRupee className="absolute top-8 left-32 w-10 h-10  opacity-0 group-hover:opacity-90 group-hover:translate-x-16 transition-all duration-300 ease-in-out"  color="#7C70E0"/>
        </div>
        <div className=" col-span-3 border bento-grid row-span-4 group">
          <h1 className="bento-grid-heading">Safety <br/> Secuirty</h1>
          <p className="bento-grid-text">Learn how to transact securely with our comprehensive safety guide.</p>
          <LearMore link="/safety-guide"/>

          <LockOpen className="absolute top-8 right-10 w-10 h-10   opacity-85 group-hover:opacity-0 transition-all duration-300 ease-in-out"  color="#7C70E0"/>
          <Lock className="absolute top-8 right-10 w-10 h-10  opacity-0 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300 ease-in-out"  color="#7C70E0"/>

        </div>
        <div className=" col-span-5 border bento-grid row-span-2 group" >
          <h1 className="bento-grid-heading">From the Blogs</h1>
          <p className="bento-grid-text">Get tips, news, and updates from the Passitpal team.</p>
          <LearMore link="/blog"/>
          <Shapes className="absolute top-3 right-10 w-10 h-10  opacity-85 group-hover:rotate-180 transition-all duration-300 ease-in-out"  color="#7C70E0"/>
        </div>

      </div>


    </div>
  );
};

export default FeaturedContent;


const LearMore = ({link}: {link: string}) => {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(link)} className="absolute flex items-center gap-2 bottom-4 cursor-pointer text-[#4338ca]">
            <span className="opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-in-out">
              Learn more
            </span>
            <ArrowRightIcon className="w-4 h-4 transform -translate-x-20 group-hover:translate-x-0 transition-transform duration-300" />
  </div>
  )
}