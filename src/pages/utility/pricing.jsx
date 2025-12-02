import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import img1 from "@/assets/images/all-img/big-shap1.png";
import img2 from "@/assets/images/all-img/big-shap2.png";
import img3 from "@/assets/images/all-img/big-shap3.png";
import img4 from "@/assets/images/all-img/big-shap4.png";
import RazorpayPopUp from './RazorpayPopUp'; // Import RazorpayPopUp component
import { fetchPOST } from '@/store/api/apiSlice';

const PricingPage = ({ plans }) => {
  const filteredPlans = plans.filter(plan => plan.title !== "Free");

  const tables = filteredPlans.map((plan, index) => ({
    title: plan.title,
    size: plan.size_mb,
    price_Yearly: `${(parseFloat(plan.price) * 12).toFixed(2)}`,
    price_Monthly: `${parseFloat(plan.price).toFixed(2)}`,
    description: plan.description,
    bg: ["bg-warning-500", "bg-info-500", "bg-success-500", "bg-primary-500"][index % 4],
    img: [img1, img2, img3, img4][index % 4],
  }));

  const [check, setCheck] = useState(false);
  const [displayRazorpay, setDisplayRazorpay] = useState(false);
  const [orderDetails, setOrderDetails] = useState({ orderId: null, currency: null, amount: null });
  const [selectedPlan, setSelectedPlan] = useState(null); // New state for selected plan
  const [paymentStatus, setPaymentStatus] = useState(null); // Track payment status

  const toggle = () => {
    setCheck(!check);
  };

  const handleCreateOrder = async (plan) => {
    const amount = check ? plan.price_Yearly : plan.price_Monthly;
    try {
      const data = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/create-order/`, { body: { amount: amount * 100, currency: "INR" } });
      if (data && data.id) {
        setOrderDetails({
          orderId: data.id,
          currency: data.currency,
          amount: data.amount,
        });
        setSelectedPlan(plan); // Store the selected plan
        setPaymentStatus('in progress'); // Set initial payment status
        setDisplayRazorpay(true);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const closeRazorpayPopup = () => {
    setDisplayRazorpay(false);
    setSelectedPlan(null); // Reset selected plan after closing
    setPaymentStatus(null); // Reset payment status after closing
  };

  return (
    <div>
      <div className="space-y-5">
        <Card>
          <div className="flex justify-between mb-6">
            <h4 className="text-slate-900 text-xl font-medium">Storage Subscriptions Plans</h4>
            <label className="inline-flex text-sm cursor-pointer">
              <input type="checkbox" onChange={toggle} hidden />
              <span
                className={`
              ${!check
                    ? "bg-slate-900 dark:bg-slate-900 text-white"
                    : " dark:text-slate-300"
                  }
                px-[18px] py-1 transition duration-100 rounded
                `}
              >
                Monthly
              </span>
              <span
                className={` ${check
                  ? "bg-slate-900 dark:bg-slate-900 text-white"
                  : "dark:text-slate-300"
                  } 
                px-[18px] py-1 transition duration-100 rounded`}
              >
                Yearly
              </span>
            </label>
          </div>
          <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-5">
            {tables.map((item, i) => (
              <div
                className={` ${item.bg}
          price-table bg-opacity-[0.16] dark:bg-opacity-[0.36] rounded-[6px] p-6 text-slate-900 dark:text-white relative overflow-hidden z-[1]
          `}
                key={i}
              >
                <div className="overlay absolute right-0 top-0 w-full h-full z-[-1]">
                  <img src={item.img} alt="" className="ml-auto block" />
                </div>
                <header className="mb-6">
                  <h4 className="text-xl mb-5">{item.title}</h4>

                  <span className="text-xs text-warning-500 font-medium px-3 py-1 rounded-full inline-block bg-white uppercase h-auto">
                      Save 20%
                    </span>
                  <div className="space-x-4 relative flex items-center mb-5 rtl:space-x-reverse">
                    {check ? (
                      <span className="text-lg leading-10 font-medium">{`RS ${item.price_Yearly}/Year`}</span>
                    ) : (
                      <span className="text-lg leading-10 font-medium">{`Rs ${item.price_Monthly}/Month`}</span>
                    )}
                  
                  </div>

                  <p className="text-slate-500 dark:text-slate-300 text-sm font-bold">
                    {(item.size / 1024).toFixed(2)} GB
                  </p>
                </header>
                <div className="price-body space-y-8">
                  <p className="text-sm leading-5 text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>
                  <div>
                    <Button
                      text='Buy now'
                      className="btn-outline-dark dark:border-slate-400 w-full"
                      onClick={() => handleCreateOrder(item)} // Pass the plan item
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {displayRazorpay && selectedPlan && (
        <RazorpayPopUp
          amount={orderDetails.amount}
          currency={orderDetails.currency}
          orderId={orderDetails.orderId}
          keyId={import.meta.env.VITE_RAZORPAY_KEY_ID}
          keySecret={import.meta.env.VITE_APP_RAZORPAY_KEY_SECRET}
          closePopup={closeRazorpayPopup}
          paymentPlan={check ? 'yearly' : 'monthly'} // Determine payment plan based on the checkbox
          sizeByInMb={selectedPlan.size} // Use the selected plan's size
          setPaymentStatus={setPaymentStatus} // Pass status handler
        />
      )}
    </div>
  );
};

export default PricingPage; 
