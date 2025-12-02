import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ForgotPass from "./common/forgot-pass";
import useDarkMode from "@/hooks/useDarkMode";

import IconWhite from "@/assets/images/common/app-icon-white.png";
import Icon from "@/assets/images/common/app-icon.webp";
import ForgotpassImage from "@/assets/images/common/forgot-password.webp";
import { Helmet } from "react-helmet-async";
const forgotPass = () => {
  const [isDark] = useDarkMode();
  const navigate = useNavigate();

  return (
    <>
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
      <title>Forgot Password – Dyzo</title>
    </Helmet>
    <div className="loginwrapper">
      <div className="lg-inner-column">
        <div className="left-column relative z-[1]">
          <div>
            <img
              src={ForgotpassImage}
              alt=""
              className="h-screen w-full object-cover cursor-pointer"
              loading="lazy"
              onClick={() => navigate("/")}
            />
          </div>
        </div>
        <div className="right-column relative">
          <div className="inner-content h-full flex flex-col bg-white dark:bg-slate-800">
            <div className="auth-box2 flex flex-col justify-center h-full px-6">
              <div className="mobile-logo text-center mb-8 lg:hidden block">
                <Link to="/" className="flex justify-center items-center">
                  <img
                    src={isDark ? IconWhite : Icon}
                    alt=""
                    className="w-12 transition-all duration-300 hover:scale-110"
                  />
                  <h4 className="pt-2 text-xl font-semibold">Dyzo</h4>
                </Link>
              </div>
              <div className="text-center 2xl:mb-12 mb-8">
                <h4 className="font-semibold text-2xl mb-3 text-slate-900 dark:text-white">Forgot Your Password?</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Enter your email address and we'll send you a link to reset your password.</p>
              </div>

              <ForgotPass />
              <div className="md:max-w-[345px] mx-auto font-normal text-slate-500 dark:text-slate-400 2xl:mt-12 mt-8 text-sm">
                <span className="uppercase">Forget It,</span>
                <Link
                  to="/login"
                  className="text-slate-900 dark:text-white font-medium hover:text-primary-500 dark:hover:text-primary-500 transition-colors duration-300 ml-1"
                >
                  Send me Back
                </Link>
                <span className="uppercase ml-1">to The Sign In</span>
              </div>
            </div>
            <div className="auth-footer text-center py-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Copyright 2025, Dyzo All Rights Reserved. 
                <a href="/terms-and-conditions" className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 ml-1 transition-colors duration-300">
                  Terms & Conditions
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default forgotPass;
