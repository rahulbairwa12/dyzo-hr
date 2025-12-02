import { fetchAuthGET, fetchPOST } from "@/store/api/apiSlice";
import { React, useEffect, useState } from "react";
import PlanCard from "./PlanCard";
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
  const [subscriptionError, setSubscriptionError] = useState(null);
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

  // When a plan is selected, check team size and create subscription if allowed.
  const handleCreateSubscription = async (price, team_size, plan) => {
    if (!userInfo) {
      navigate("/register");
      return;
    }
    // Check if company's total employees exceed the plan's allowed team size.
    if (company && parseInt(company.total_employees) > parseInt(team_size)) {
      setSubscriptionError({
        totalEmployees: company.total_employees,
        planTeamSize: team_size,
      });
      return;
    } else {
      setSubscriptionError(null);
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
      {/* <div
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
      </div> */}
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
          <div className="max-w-7xl mx-auto pt-4 pb-6 px-3 lg:px-0">
            <h1 className="text-4xl font-bold text-center">Upgrade your plan</h1>

            {/* Error alert for team size mismatch */}
            {subscriptionError && (
              <div className="bg-red-50 border border-red-200 text-sm text-red-800 rounded-lg p-4 dark:bg-red-800/10 dark:border-red-900 dark:text-red-500" role="alert" tabIndex="-1" aria-labelledby="hs-with-list-label">
                <div className="flex">
                  <div className="shrink-0">
                    <svg className="shrink-0 size-4 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m15 9-6 6"></path>
                      <path d="m9 9 6 6"></path>
                    </svg>
                  </div>
                  <div className="ms-4">
                    <h3 id="hs-with-list-label" className="text-sm font-semibold">
                      A problem has occurred while submitting your data.
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                      <ul className="list-disc space-y-1 ps-5">
                        <li>
                          You have {subscriptionError.totalEmployees} employees, and this plan supports only {subscriptionError.planTeamSize} users.
                        </li>
                        <li>
                          Please upgrade to a higher plan.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center mt-6">
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
            <div className="relative mt-10">
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
            <div key={tab} className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mt-8 slide-in">
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
                  // Calculate plan price (and conversion if needed)
                  const planPrice = parseFloat(plan.price);
                  const convertedPrice = currency === "USD"
                    ? Number((planPrice * conversionRate).toFixed(2))
                    : planPrice;
                  // Compute per-user cost (if team_size is numeric)
                  const teamSize = parseFloat(plan.team_size);
                  const perUserCost = teamSize > 0
                    ? currency === "USD"
                      ? Number(((planPrice * conversionRate) / teamSize).toFixed(2))
                      : Number((planPrice / teamSize).toFixed(2))
                    : 0;
                  const currencySymbol = currency === "USD" ? "$" : "₹";
                  // Update display values
                  const displayPrice = convertedPrice;
                  const displayPriceDescription = currency === "USD"
                    ? `${currencySymbol}${convertedPrice} USD / month subscription`
                    : `${currencySymbol}${convertedPrice} INR / month subscription`;
                  const displayTotalBilling = `~${currencySymbol}${perUserCost} per user per month`;

                  const isCurrentPlan =
                    userInfo &&
                    currentPlan &&
                    parseInt(plan.user_plan_id) === parseInt(currentPlan.user_plan_id);

                  // New button text logic based on plan price compared to current plan
                  const buttonText = userInfo
                    ? isCurrentPlan
                      ? "Your current plan"
                      : parseFloat(plan.price) === 0
                        ? "Get Started"
                        : currentPlan && parseFloat(currentPlan.price) > 0
                          ? parseFloat(plan.price) < parseFloat(currentPlan.price)
                            ? `Degrade to Dyzo ${plan.title}`
                            : `Upgrade to Dyzo ${plan.title}`
                          : `Upgrade to Dyzo ${plan.title}`
                    : parseFloat(plan.price) === 0
                      ? "Get Started"
                      : `Upgrade to Dyzo ${plan.title}`;

                  return (
                    <div key={plan.user_plan_id}>
                      <PlanCard
                        title={plan.title}
                        description={plan.description}
                        price={displayPrice}
                        priceDescription={displayPriceDescription}
                        TotalBilling={displayTotalBilling}
                        storage={plan.storage}
                        handleCreateOrder={() =>
                          handleCreateSubscription(parseFloat(plan.price), plan.team_size, plan)
                        }
                        handleFreeAction={handleFreeAction}
                        subscriptionShortUrl={subscriptionShortUrl}
                        team_size={plan.team_size}
                        isCurrentPlan={isCurrentPlan}
                        currency={currency}
                        buttonText={buttonText}
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
        </>
      )}
    </>
  );
}
