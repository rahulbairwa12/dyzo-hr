import React from "react";
import PriceNavbar from "./PriceNavbar";
import BlackFridayBgImage from "@/assets/images/common/black-friday-bg1.jpg";

const BlackFridaySell = () => {
    return (
        <div>
            <PriceNavbar />
            <section className="bg-slate-900 min-h-[95vh] flex justify-center items-center bg-cover bg-center"  style={{ backgroundImage: `url(${BlackFridayBgImage})` }}>
                <div className="mx-auto py-5">
                    <div className="text-center">
                        <h3 className="text-white">BLACK FRIDAY SALE</h3>
                        <h2 className="text-slate-100 py-6">50% OFF</h2>
                        <h3 className="text-slate-100">Best Team Management Tool</h3>
                    </div>

                    <div className="flex justify-center py-6">
                        {/* <div id="paypal-button-container-P-7Y779815S8740890TM5E4S6Y"></div> */}

                        <a href="https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-7Y779815S8740890TM5E4S6Y">
                            <button className="text-white bg-yellow-600 font-bold px-6 py-4 rounded-md">Buy Now</button>
                        </a>
                    </div>
                </div>

                
            </section>
        </div>
    );
};

export default BlackFridaySell;