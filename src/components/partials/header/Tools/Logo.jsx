import React from "react";
import useDarkMode from "@/hooks/useDarkMode";
import { Link } from "react-router-dom";
import useWidth from "@/hooks/useWidth";

import AiLogo from "@/assets/images/logo/dyzo-ai-logo.png";
// Use the same AI logo for both light and dark themes, desktop and mobile
const MainLogo = AiLogo;
const LogoWhite = AiLogo;
const MobileLogo = AiLogo;
const MobileLogoWhite = AiLogo;
const Logo = () => {
  const [isDark] = useDarkMode();
  const { width, breakpoints } = useWidth();

  return (
    <div>
      <Link to="/dashboard">
        {width >= breakpoints.xl ? (
          <img src={isDark ? LogoWhite : MainLogo} alt="" className="w-8"/>
        ) : (
          <img src={isDark ? MobileLogoWhite : MobileLogo} alt="" className="w-8"/>
        )}
      </Link>
    </div>
  );
};

export default Logo;
