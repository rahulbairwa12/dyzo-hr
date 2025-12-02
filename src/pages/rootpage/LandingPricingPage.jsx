import React from "react";
import Tidio from "./Tidio";
import Footer from "./Footer";
import Header from "./Header";
import UserPlan from "@/pages/plans/UserPlan-old";
import PriceHeader from "../plans/PriceNavbar";

const LandingPricingPage = () => {
  return (
    <>
      <PriceHeader />
      <Tidio />
      <UserPlan />
      <Footer />
    </>
  );
};

export default LandingPricingPage;
