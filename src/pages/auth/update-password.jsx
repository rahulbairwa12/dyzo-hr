import React from "react";
import { Link } from "react-router-dom";
import UpdatePasswordForm from "./common/update-password";
import useDarkMode from "@/hooks/useDarkMode";

// image import
import ForgotpassImage from "@/assets/images/common/forgot-password.webp";
import IconWhite from "@/assets/images/common/app-icon-white.png";
import Icon from "@/assets/images/common/app-icon.webp";

const UpdatePassword = () => {
  const [isDark] = useDarkMode();
  return (
    <div className="loginwrapper">
      <div className="lg-inner-column">
        <div className="left-column relative z-[1]">
          <div>
            <img
              src={ForgotpassImage}
              alt=""
              className="h-full w-full object-contain"
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
                <h4 className="font-medium">Reset Password</h4>
                <div className="text-slate-500 text-base">
                  Reset your dyzo password
                </div>
              </div>
              <UpdatePasswordForm/>
            </div>
            <div className="auth-footer text-center">
  Copyright 2024, Dyzo All Rights Reserved. <a href="/terms-and-conditions">terms & Condition</a>
</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
