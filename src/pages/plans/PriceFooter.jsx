import React from "react";
import { useNavigate } from "react-router-dom";

const PriceFooter = () => {
  const navigate = useNavigate()

  return (
    <section className="bg-black-500 dark:bg-slate-900">
      <div className="text-center py-32">
        <h1 className="text-xl px-2 mb-4 text-white">
          Not sure which plan is right for you?
        </h1>
        <button className="bg-blue-600 text-white py-2 px-4 rounded" onClick={() => navigate('/contactus')}>
          Contact us
        </button>
      </div>
    </section>
  );
};

export default PriceFooter;