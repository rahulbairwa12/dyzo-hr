import { useState, useMemo } from "react";
export default function useWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  // breakpoints
  const breakpoints = {
    xs: "465",
    sm: "640",
    md: "768",
    lg: "1023",
    xl: "1280",
  };

  // resize widnow size and set width by useMemo
  useMemo(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return { width, breakpoints };
}
