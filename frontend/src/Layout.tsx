import React from "react";
import { Outlet } from "react-router";
import {NavBar} from "@/components/nav/NavBar";
import Footer from "@/components/footer/Footer";
import LocationPrompt from "./components/shared/LocationPrompt";



const Layout : React.FC = () => {
  return (
    <div>
      <LocationPrompt />
      <NavBar />
      <div>
        <Outlet />
      </div>
      <Footer/>
    </div>
  );
};

export default Layout;