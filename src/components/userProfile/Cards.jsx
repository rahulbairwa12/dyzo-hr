import React from "react";
import useSkin from "@/hooks/useSkin";
import Icons from "../ui/Icon";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

const Cards = ({
  children,
  title,
  subtitle,
  headerslot,
  className = "custom-class",
  bodyClass = "p-6",
  noborder,
  titleClass = "custom-class",
  onClick,
  
}) => {
  const [skin] = useSkin();

  const userInfo = useSelector((state) => state.auth.user);
  const {userId} = useParams()

  return (
    <div
      className={`
                card rounded-md bg-white dark:bg-slate-800
                ${skin === "bordered" ? " border border-slate-200 dark:border-slate-700" : "shadow-base"}
                ${className}
            `}
    >
      {(title || subtitle) && (
        <header className={`card-header ${noborder ? "no-border" : ""}`}>
          <div>
            {title && <div className={`card-title ${titleClass}`}>{title}</div>}
            {subtitle && <div className="card-subtitle">{subtitle}</div>}
          </div>
          {headerslot && <div className="card-header-slot">{headerslot}</div>}
          {userId == userInfo?._id && (
            <button onClick={onClick}>
              <Icons icon="heroicons:pencil-square" className="w-6 h-6" />
            </button>
          )}
        </header>
      )}
      <main className={`card-body ${bodyClass}`}>{children}</main>
    </div>
  );
};

export default Cards;
