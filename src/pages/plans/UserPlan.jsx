import { fetchAuthGET, fetchPOST } from "@/store/api/apiSlice";
import { React, useEffect, useState } from "react";
import PlanCard from "./PlanCard";
import PriceFooter from "./PriceFooter";
import PriceNavbar from "./PriceNavbar";
import LoaderCircle from "@/components/Loader-circle";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [subscriptionShortUrl, setSubscriptionShortUrl] = useState([]);
  const [company, setCompany] = useState(null);
  const [tab, setTab] = useState("small"); // "small" for Individuals, "business" for Enterprises
  const [currency, setCurrency] = useState("INR");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const conversionRate = 0.012; // for USD conversion

  const userInfo = useSelector((state) => state?.auth.user);
  const navigate = useNavigate();

  // Fetch company details (which includes user_plans)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/company/details/`);
        if (data) {
          setPlans(data.user_plans);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch user-specific data (including current plan and subscription short_url) 
  useEffect(() => {
    if (userInfo && plans?.length > 0) {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          const data = await fetchAuthGET(
            `${import.meta.env.VITE_APP_DJANGO}/company/${userInfo.companyId}/details/`
          );
          if (data) {
            if (data.latest_payment && data.latest_payment.current_plan) {
              setCurrentPlan(data.latest_payment.current_plan);
              if (data.subscriptions) {
                console.log("data.subscriptions.short_url", data.subscriptions.short_url);
                setSubscriptionShortUrl(data.subscriptions);
              }
            } else {
              const freePlan = plans.find(plan => plan.title.toLowerCase() === "free");
              if (freePlan) setCurrentPlan(freePlan);
            }
            setCompany(data.company);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          const freePlan = plans.find(plan => plan.title.toLowerCase() === "free");
          if (freePlan) setCurrentPlan(freePlan);
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }
  }, [userInfo, plans]);

  // Detect user's location to set currency.
  useEffect(() => {
    async function detectUserLocation() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data && data.country) {
          setCurrency(data.country === "IN" ? "INR" : "USD");
        } else {
          setShowCurrencyDropdown(true);
        }
      } catch (error) {
        setShowCurrencyDropdown(true);
      }
    }
    detectUserLocation();
  }, []);

  // When a plan is selected, call the create_subscription API and open the returned short_url.
  const handleCreateSubscription = async (price, team_size, plan) => {
    if (!userInfo) {
      navigate("/register");
      return;
    }
    // Use the plan price directly.
    let finalPrice = parseFloat(price);
    if (currency === "USD") {
      finalPrice = Number((finalPrice * conversionRate).toFixed(2));
    }
    try {
      const data = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/create-subscription/`, {
        body: {
          amount: finalPrice,
          currency: currency === "USD" ? "USD" : "INR",
          payment_plan: "monthly",
          company_id: userInfo.companyId,
          employee_id: userInfo._id,
          plan_id: plan.razorpay_plan_id,
        },
      });
      if (data && data.short_url) {
        window.open(data.short_url, "_blank");
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
    }
  };

  const handleStaticAction = () => {
    window.open("https://calendly.com/tushar-46/dyzo-ai-demo-call", "_blank");
  };

  const handleFreeAction = () => {
    navigate("/login");
  };

  return (
    <>
      <style>{`
        .slide-in {
          animation: slide-in 0.5s ease-in-out;
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          cursor: "pointer",
          zIndex: 1000,
        }}
        onClick={() => navigate(-1)}
      >
        <Icon icon="maki:cross" width="24" height="24" />
      </div>
      {showCurrencyDropdown && (
        <div
          style={{
            position: "fixed",
            top: "50px",
            right: "10px",
            zIndex: 1000,
            background: "#fff",
            padding: "5px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        >
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="INR">INR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      )}
      {loading && <LoaderCircle />}
      {!loading && (
        <>
          <div className="max-w-7xl mx-auto pt-12 pb-6 px-3 lg:px-0">
            <h1 className="text-4xl font-bold text-center">Upgrade your plan</h1>
            <div className="flex justify-center mt-8">
              <button
                className={`px-6 py-2 flex items-center space-x-2 ${tab === "small" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"} rounded-md`}
                onClick={() => setTab("small")}
              >
                <Icon icon="tabler:users" width="24" height="24" />
                <span>Individuals & Small Team</span>
              </button>
              <button
                className={`px-6 py-2 flex items-center space-x-2 ${tab === "business" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"} rounded-md`}
                onClick={() => setTab("business")}
              >
                <Icon icon="cuida:building-outline" width="24" height="24" />
                <span>Businesses & Enterprises</span>
              </button>
            </div>
            <div className="relative mt-12">
              <span className="absolute top-[-17px] right-[28%] transform -translate-x-1/2 -translate-y-1/2 px-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <svg
                    className="w-14 h-8 -mr-6"
                    width="45"
                    height="25"
                    viewBox="0 0 45 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M43.2951 3.47877C43.8357 3.59191 44.3656 3.24541 44.4788 2.70484C44.5919 2.16427 44.2454 1.63433 43.7049 1.52119L43.2951 3.47877ZM4.63031 24.4936C4.90293 24.9739 5.51329 25.1423 5.99361 24.8697L13.8208 20.4272C14.3011 20.1546 14.4695 19.5443 14.1969 19.0639C13.9242 18.5836 13.3139 18.4152 12.8336 18.6879L5.87608 22.6367L1.92723 15.6792C1.65462 15.1989 1.04426 15.0305 0.563943 15.3031C0.0836291 15.5757 -0.0847477 16.1861 0.187863 16.6664L4.63031 24.4936ZM43.7049 1.52119C32.7389 -0.77401 23.9595 0.99522 17.3905 5.28788C10.8356 9.57127 6.58742 16.2977 4.53601 23.7341L6.46399 24.2659C8.41258 17.2023 12.4144 10.9287 18.4845 6.96211C24.5405 3.00476 32.7611 1.27399 43.2951 3.47877L43.7049 1.52119Z"
                      fill="currentColor"
                      className="fill-gray-300 dark:fill-neutral-700"
                    />
                  </svg>
                  <span className="mt-3 inline-block whitespace-nowrap text-[11px] leading-5 font-semibold tracking-wide uppercase bg-blue-600 text-white rounded-full py-1 px-2.5">
                    Save up to 10%
                  </span>
                </span>
              </span>
            </div>
            <div key={tab} className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mt-12 slide-in">
              {plans
                ?.filter((plan) => {
                  if (tab === "small" && plan.team_size > 50) return false;
                  if (tab === "business" && plan.team_size <= 50) return false;
                  return true;
                })
                ?.sort((a, b) => {
                  if (a.card_position === b.card_position) {
                    return Number(a.user_plan_id) - Number(b.user_plan_id);
                  }
                  return Number(a.card_position) - Number(b.card_position);
                })
                ?.map((plan) => {
                  let displayPrice, displayPriceDescription, displayTotalBilling;
                  if (currency === "USD") {
                    displayPrice = Number((parseFloat(plan.price) * conversionRate).toFixed(2));
                    displayPriceDescription = `$${displayPrice} USD / month subscription`;
                    displayTotalBilling = `$${displayPrice} USD per month`;
                  } else {
                    displayPrice = plan.price;
                    displayPriceDescription = `₹${displayPrice} INR / month subscription`;
                    displayTotalBilling = `₹${displayPrice} INR per month`;
                  }
                  
                  const isCurrentPlan =
                    userInfo &&
                    currentPlan &&
                    parseInt(plan.user_plan_id) === parseInt(currentPlan.user_plan_id);
                  
                  return (
                    <div key={plan.user_plan_id}>
                      <PlanCard
                        title={plan.title}
                        description={plan.description}
                        price={displayPrice}
                        priceDescription={displayPriceDescription}
                        TotalBilling={displayTotalBilling}
                        handleCreateOrder={() =>
                          handleCreateSubscription(parseFloat(plan.price), plan.team_size, plan)
                        }
                        handleFreeAction={handleFreeAction}
                        subscriptionShortUrl={subscriptionShortUrl}
                        team_size={plan.team_size}
                        isYearly={false}
                        isCurrentPlan={isCurrentPlan}
                        currency={currency}
                        buttonText={
                          userInfo
                            ? isCurrentPlan
                              ? "Your current plan"
                              : parseFloat(plan.price) === 0
                              ? "Get Started"
                              : `Upgrade to Dyzo ${plan.title}`
                            : parseFloat(plan.price) === 0
                            ? "Get Started"
                            : `Upgrade to Dyzo ${plan.title}`
                        }
                        recommended={plan?.title === "Advanced"}
                      />
                    </div>
                  );
                })}
              {tab === "business" && (
                <div key="enterprise-static-card">
                  <PlanCard
                    title="Enterprise+"
                    description="For companies that need strict compliance with flexible, precise controls."
                    price="Contact sales for pricing"
                    priceDescription="Everything in Enterprise, plus"
                    TotalBilling="Contact Us for Pricing"
                    buttonText="Contact Us"
                    isStatic={true}
                    handleStaticAction={handleStaticAction}
                    recommended={false}
                    storage="Custom storage"
                    team_size="50+ Or Custom size"
                    currency={currency}
                  />
                </div>
              )}
            </div>
          </div>
          <PriceFooter />
        </>
      )}
    </>
  );
}
