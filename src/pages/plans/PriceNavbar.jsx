import React, { useState } from "react";
import dyzoLogo from "@/pages/rootpage/images/dyzoLogo.svg";
import { useNavigate } from "react-router-dom";

const PriceHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="headerBox w-full dark:bg-slate-900  ">
      <div className="max-w-[1320px] mx-auto flex  lg:flex-row items-center justify-between">
        <div
          className="flex items-center  lg:mb-0 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={dyzoLogo} width="96px" height="auto" alt="DYZO" />
        </div>

        <div className="flex items-center gap-1 ">
          <a
            href="https://calendly.com/tushar-46/dyzo-ai-demo-call" target="_blank"
            className="text-black text-sm hover:underline hidden md:block dark:text-white"
          >
            Have questions about pricing or billing?{" "}
          </a>
          <a
            href="https://calendly.com/tushar-46/dyzo-ai-demo-call" target="_blank"
            className=" ml-1 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:text-white  dark:focus:ring-primary-900"
          >
            Chat with us
          </a>
        </div>

      </div>

    </header>
  );
};

export default PriceHeader;