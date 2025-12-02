import React from "react";
import { Link } from "react-router-dom";
import ErrorImage from "@/assets/images/all-img/RestrictedAccess.png";

const RestrictedAccess = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center py-20 dark:bg-slate-900">
      <img src={ErrorImage} alt="restricted" />
      <div className="max-w-[546px] mx-auto w-full mt-12">
        <div className="dark:text-white text-base font-normal mb-10">
        Access to this page is restricted to authorized users only
        </div>
      </div>
      <div className="max-w-[300px] mx-auto w-full">
        <Link
          to="/"
          className="btn btn-dark dark:bg-slate-800 block text-center"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  );
};

export default RestrictedAccess;
