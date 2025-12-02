import { fetchAuthGET, fetchPOST } from "@/store/api/apiSlice";
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import LendingPagePlanCard from "./PlanCard";
import PriceFooter from "./PriceFooter";
import PriceNavbar from "./PriceNavbar";
import LoaderCircle from "@/components/Loader-circle";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import displayRazorpay from "./dispalyrazorpay";
import { Icon } from "@iconify/react";

export default function LendingPageUserPlan() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [company, setCompany] = useState(null);
  // Tab toggle: "small" for Individuals & Small Team, "business" for Businesses & Enterprises
  const [tab, setTab] = useState("small");
  const userInfo = useSelector((state) => state?.auth.user);
  const navigate = useNavigate();

  // Fetch plans for all users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchAuthGET(
          `${import.meta.env.VITE_APP_DJANGO}/company/details/`
        );

        if (data) {
          setPlans(data.user_plans);
        }
      } catch (error) {
        // Handle error if needed
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch user-specific data (current plan) only when userInfo exists and plans are loaded
  useEffect(() => {
    if (userInfo && plans.length > 0) {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          const data = await fetchAuthGET(
            `${import.meta.env.VITE_APP_DJANGO}/company/${userInfo?.companyId
            }/details/`
          );
          if (data) {
            if (data.latest_payment && data.latest_payment.current_plan) {
              // Add the payment_plan property from latest_payment to current_plan
              setCurrentPlan({
                ...data.latest_payment.current_plan,
                payment_plan: data.latest_payment.payment_plan,
              });
            } else {
              // Fallback: find a plan with title "Free"
              const freePlan = plans.find(
                (plan) => plan.title.toLowerCase() === "free"
              );
              if (freePlan) {
                setCurrentPlan(freePlan);
              }
            }
            setCompany(data.company);
          }
        } catch (error) {
          // On error fallback to free plan
          const freePlan = plans.find(
            (plan) => plan.title.toLowerCase() === "free"
          );
          if (freePlan) {
            setCurrentPlan(freePlan);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }
  }, [userInfo, plans]);

  // Used for paid plans – creates an order via Razorpay
  const handleCreateOrder = async (price, team_size, plan) => {
    if (!userInfo) {
      navigate("/register");
      return;
    }
    try {
      const data = await fetchPOST(
        `${import.meta.env.VITE_APP_DJANGO}/create-order/`,
        {
          // Razorpay expects the amount in paise
          body: { amount: price * 100, currency: "INR" },
        }
      );
      if (data && data.id) {
        displayRazorpay(
          data.id,
          price,
          data.currency,
          userInfo,
          team_size,
          plan,
          "monthly",
          navigate
        );
      }
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  // For the static Enterprise card
  const handleStaticAction = () => {
    window.open("https://calendly.com/tushar-46/dyzo-ai-demo-call", "_blank");
  };

  // For free plans (price zero): navigate to /login
  const handleFreeAction = () => {
    navigate("/login");
  };

  const renderPlans = (planType) => {
    return plans
      ?.filter((el) => el?.plan_type === planType)
      ?.filter((plan) =>
        tab === "small" ? plan.team_size <= 40 : plan.team_size > 40
      )
      ?.sort((a, b) => Number(a.price) - Number(b.price))
      ?.map((plan) => {
        const displayPrice = plan.price;
        const displayPriceDescription = `₹${Math.floor(
          parseFloat(plan.price) / plan.team_size
        )} INR / seat / ${planType === "monthly" ? "month" : "year"}`;
        const displayTotalBilling = `₹${parseFloat(plan.price).toFixed(2)} / ${planType === "monthly" ? "month" : "year"
          }`;

        const isCurrentPlan =
          userInfo &&
          currentPlan &&
          parseInt(plan.user_plan_id) === parseInt(currentPlan.user_plan_id);

        return (
          <div key={plan.user_plan_id}>
            <LendingPagePlanCard
              title={plan.title}
              description={plan.description}
              price={displayPrice}
              priceDescription={displayPriceDescription}
              TotalBilling={displayTotalBilling}
              handleCreateOrder={() =>
                handleCreateOrder(parseFloat(plan.price), plan.team_size, plan)
              }
              handleFreeAction={handleFreeAction}
              storage={plan?.storage}
              buttonText={
                userInfo
                  ? isCurrentPlan
                    ? "Your current plan"
                    : parseFloat(plan.price) === 0
                      ? "Get Started"
                      : `Upgrade to Dyzo ${plan.title}`
                  : "Get Started"
              }
              recommended={plan?.title === "Advanced"}
              team_size={plan.team_size}
              isYearly={planType === "yearly"}
              isCurrentPlan={isCurrentPlan}
            />
          </div>
        );
      });
  };

  return (
    <>
     
      {/* Inline styles for slide animation */}
      <style>{`
        .slide-in {
          animation: slide-in 0.5s ease-in-out;
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {loading && <LoaderCircle />}
      {!loading && (
        <>
          <PriceNavbar />
          <div className="max-w-7xl mx-auto pt-12 pb-6 px-3 lg:px-0">
            <h1 className="text-4xl font-bold text-center">Choose your plan</h1>
            <p className="text-center text-gray-600 mt-4 text-base md:text-xl max-w-3xl m-auto font-medium dark:text-white">
              "Dyzo brings more transparency to your business with an all-in-one
              tool for managing tasks, projects, screenshots, and clients—One
              Step to Productivity."
            </p>

            {/* Tab toggle for Individuals/Businesses */}
            <div className="flex justify-center mt-8">
              <button
                className={`px-6 py-2 flex items-center space-x-2 ${tab === "small"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
                  } rounded-md`}
                onClick={() => setTab("small")}
              >
                <Icon icon="tabler:users" width="24" height="24" />
                <span>Individuals & Small Team</span>
              </button>
              <button
                className={`px-6 py-2 flex items-center space-x-2 ${tab === "business"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
                  } rounded-md`}
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

            {/* Plans Grid with slide animation */}
            <div
              key={tab}
              className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mt-12 slide-in"
            >
              {/* {plans
                ?.filter((plan) =>
                  tab === "small" ? plan.team_size <= 40 : plan.team_size > 40
                )
                ?.sort((a, b) => Number(a.price) - Number(b.price))
                ?.map((plan) => {
                  // Compute display values for monthly only
                  const displayPrice = plan.price;
                  const displayPriceDescription = `₹${Math.floor(
                    parseFloat(plan.price) / plan.team_size
                  )} INR / seat / month`;
                  const displayTotalBilling = `₹${parseFloat(
                    plan.price
                  ).toFixed(2)} / month`;

                  // Determine if this plan is the current plan.
                  const isCurrentPlan =
                    userInfo &&
                    currentPlan &&
                    parseInt(plan.user_plan_id) ===
                      parseInt(currentPlan.user_plan_id);

                  return (
                    <div key={plan.user_plan_id}>
                      <LendingPagePlanCard
                        title={plan.title}
                        description={plan.description}
                        price={displayPrice}
                        priceDescription={displayPriceDescription}
                        TotalBilling={displayTotalBilling}
                        handleCreateOrder={() =>
                          handleCreateOrder(
                            parseFloat(plan.price),
                            plan.team_size,
                            plan
                          )
                        }
                        handleFreeAction={handleFreeAction}
                        storage={plan?.storage}
                        buttonText={
                          userInfo
                            ? isCurrentPlan
                              ? "Your current plan"
                              : parseFloat(plan.price) === 0
                              ? "Get Started"
                              : `Upgrade to Dyzo ${plan.title}`
                            : "Get Started"
                        }
                        recommended={plan?.title === "Advanced"}
                        team_size={plan.team_size}
                        isYearly={false}
                        isCurrentPlan={isCurrentPlan}
                      />
                    </div>
                  );
                })} */}

              {renderPlans("monthly")}
              {/* {renderPlans("yearly")} */}

              {/* Static Enterprise card for Business tab */}
              {tab === "business" && (
                <div key="enterprise-static-card">
                  <LendingPagePlanCard
                    title="Enterprise+"
                    description="For companies that need to meet strict compliance requirements with flexible, precise controls."
                    price="Contact sales for pricing"
                    priceDescription="Everything in Enterprise, plus"
                    TotalBilling="Contact Us for Pricing"
                    buttonText="Contact Us"
                    isStatic={true}
                    handleStaticAction={handleStaticAction}
                    recommended={false}
                    storage="Custom storage"
                    team_size="50+ Or Custom size"
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
