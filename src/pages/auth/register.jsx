import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useDarkMode from "@/hooks/useDarkMode";
import RegForm from "./common/reg-from";

// image import
import SignUpImage from "@/assets/images/common/sign-up.webp";
import IconWhite from "@/assets/images/common/app-icon-white.png";
import Icon from "@/assets/images/common/app-icon.webp";

const register = () => {
  const [isDark] = useDarkMode();
  const navigate = useNavigate();
  return (
    <div className="loginwrapper">
      <div className="lg-inner-column">
        <div className="left-column relative z-[1]">
          <div className="cursor-pointer" onClick={() => navigate('/')} >
            <img
              src={SignUpImage}
              alt=""
              className="h-screen w-full object-cover"
            />
          </div>
        </div>
        <div className="right-column relative bg-white dark:bg-slate-800">
          <div className="inner-content h-full flex flex-col bg-white dark:bg-slate-800">
            <div className="auth-box h-full flex flex-col justify-center">
              <div className="mobile-logo text-center mb-6 lg:hidden block">
                <Link to="/" className="flex justify-center items-center">
                  <img
                    src={isDark ? IconWhite : Icon}
                    alt=""
                    className="w-10"
                  />
                  <h4 className="pt-2">Dyzo</h4>
                </Link>
              </div>
              <div className="text-center 2xl:mb-10 mb-5">
                <h4 className="font-medium">Sign up</h4>
                <div className="text-slate-500 dark:text-slate-400 text-base">
                  Create an account to start Dyzo
                </div>
              </div>
              <RegForm />
              <div className="max-w-[300px] mx-auto font-normal text-slate-500 dark:text-slate-400 2xl:mt-12 mt-6 uppercase text-sm">
                Already have an account?
                <Link
                  to="/login"
                  className="text-slate-900 dark:text-white font-medium hover:underline mx-2"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div className="auth-footer text-center">
              Copyright 2024, Dyzo All Rights Reserved. <a href="/terms-and-conditions">Terms & Condition</a>
            </div>
          </div>
        </div>
      </div> 
    </div> 
  );
};

export default register;
