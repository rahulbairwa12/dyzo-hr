import React from "react";
import { Link } from "react-router-dom";

function Thankyou() {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center text-center py-20 dark:bg-slate-900">
            <div className="max-w-[546px] mx-auto w-full mt-12">
                <h4 className="text-slate-900 mb-4">
                    Thank You for your time
                </h4>
                <div className="dark:text-white text-base font-normal mb-10">
                    We have received your request. We will contact you soon.
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
}

export default Thankyou;
