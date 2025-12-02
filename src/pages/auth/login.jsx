import React from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginForm from "./common/login-form";
import useDarkMode from "@/hooks/useDarkMode";


// image import
import LoginImage from "@/assets/images/common/sign-in.webp";
import IconWhite from "@/assets/images/common/app-icon-white.png";
import Icon from "@/assets/images/common/app-icon.png";

const login = () => {
  const [isDark] = useDarkMode();
  const navigate = useNavigate();

  return (
    <div className="loginwrapper">
      <div className="lg-inner-column">
        <div className="left-column relative z-[1]">
          <div className="cursor-pointer" onClick={() => navigate('/')} >
            <img
              src={LoginImage}
              alt=""
              className="h-screen w-full object-cover"
            />
          </div>
        </div>
        <div className="right-column relative">
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
              <div className="text-center 2xl:mb-10 mb-4">
                <h4 className="font-medium">Sign in</h4>
                <div className="text-slate-500 text-base">
                  Sign in to your account to start using Dyzo
                </div>
              </div>
              <LoginForm />
              <div className="md:max-w-[345px] mx-auto font-normal text-slate-500 dark:text-slate-400 mt-12 uppercase text-sm">
                Don’t have an account?{" "}
                <Link
                  to="/register"
                  className="text-slate-900 dark:text-white font-medium hover:underline"
                >
                  Sign up fsdafasd
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

export default login;
