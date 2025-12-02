import { fetchAuthGET, fetchPOST } from "@/store/api/apiSlice";
import { React, useEffect, useState } from "react";
import PlanCard from "./PlanCard";
import Select from "@/components/ui/Select";
import PriceFooter from "./PriceFooter";
import PriceNavbar from "./PriceNavbar";
import LoaderCircle from "@/components/Loader-circle";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import displayRazorpay from "./dispalyrazorpay";

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSize, setUserSize] = useState(5);
  const userInfo = useSelector((state) => state?.auth.user);
  const navigate = useNavigate();

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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateOrder = async (amount) => {
    if (!userInfo) {
      navigate("/register");
      return;
    }

    try {
      const data = await fetchPOST(
        `${import.meta.env.VITE_APP_DJANGO}/create-order/`,
        { body: { amount: amount * 100, currency: "INR" } }
      );
      if (data && data.id) {
        displayRazorpay(
          data.id,
          data.amount,
          data.currency,
          userInfo,
          userSize
        );
      }
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  return (
    <>
      {loading && <LoaderCircle />}

      {!loading && (
        <>
          <PriceNavbar />
          <div className="max-w-7xl mx-auto pt-12 pb-6 px-3 lg:px-0 da">
            <h1 className="text-4xl font-bold text-center">Choose your plan</h1>
            <p className="text-center text-gray-600 mt-4 text-base md:text-xl  max-w-3xl m-auto font-medium dark:text-white">
              {" "}
              "Dyzo brings more transparency to your business with an all-in-one
              tool for managing tasks, projects, screenshots, and clients—One
              Step to Productivity."{" "}
            </p>

            <div className="flex items-center gap-3 mt-6 w-96">
              <span>Choose team size: </span>
              <Select
                options={[
                  { value: "3", label: "3 seats" },
                  { value: "5", label: "5 seats", default: true },
                  { value: "10", label: "10 seats" },
                  { value: "15", label: "15 seats" },
                  { value: "20", label: "20 seats" },
                  { value: "25", label: "25 seats" },
                  { value: "30", label: "30 seats" },
                  { value: "50", label: "50 seats" },
                ]}
                value={userSize}
                onChange={(e) => setUserSize(e.target.value)}
              />
            </div>

            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mt-12">
              {plans
                ?.sort((a, b) => a.price - b.price)
                ?.map((plan, index) => {
                  const isLastOddItem =
                    plans.length % 2 !== 0 && index === plans.length - 1;

                  return (
                    <div
                      key={plan.user_plan_id}
                      className={
                        isLastOddItem
                          ? "md:col-span-2 lg:col-span-1 w-full"
                          : ""
                      }
                    >
                      <PlanCard
                        title={plan.title}
                        description={plan.description}
                        price={plan.price}
                        priceDescription="INR / seat / month when billed monthly"
                        buttonText={`Upgrade to Dyzo ${plan.title}`}
                        recommended={plan?.title === "Standard Plan"}
                        teamSize={userSize}
                        storage={(plan?.storage / 1024)?.toFixed(0)}
                        TotalBilling={`₹${(plan.price * userSize).toFixed(
                          2
                        )} / month when billed monthly`}
                        handleCreateOrder={handleCreateOrder}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
          <PriceFooter />
        </>
      )}
    </>
  );
}
