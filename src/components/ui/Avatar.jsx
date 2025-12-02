import React from "react";
import { generateInitialsAvatar } from "@/helper/helper";

const Avatar = ({
  src,
  alt,
  name,
  size = "md",
  className = "",
  baseURL = import.meta.env.VITE_APP_DJANGO,
}) => {
  const sizeClasses = {
    xs: "w-6 h-6 min-w-[24px] min-h-[24px] text-xs",
    sm: "w-8 h-8  min-w-[32px] min-h-[32px] text-sm",
    md: "w-10 h-10  min-w-[40px] min-h-[40px] text-sm",
    lg: "w-12 h-12  min-w-[48px] min-h-[48px] text-base",
    xl: "w-16 h-16  min-w-[64px] min-h-[64px] text-lg",
    "2xl": "w-20 h-20  min-w-[80px] min-h-[80px]  text-xl",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (src) {
    return (
      <img
        src={baseURL ? `${baseURL}${src}` : src}
        alt={alt || name}
        className={`rounded-full object-cover object-top ${sizeClass} ${className}`}
      />
    );
  }

  const { initials, bgColor } = generateInitialsAvatar(name);

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold ${sizeClass} ${bgColor} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};

export default Avatar;
