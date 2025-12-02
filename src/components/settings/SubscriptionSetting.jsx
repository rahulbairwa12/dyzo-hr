import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { fetchGET } from "@/store/api/apiSlice";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";

const ManageSubscription = () => {
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state?.auth.user);

  // State to hold subscription status
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);


  function formatDateToDDMMYYYY(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
 

  // Fetch subscription status using the subscription API
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!userInfo?.companyId) return;

      try {
        setLoading(true);
        const response = await fetchGET(
          `${import.meta.env.VITE_APP_DJANGO}/api/company/subscription/?company_id=${userInfo.companyId}`
        );

        if (response) {
          setSubscriptionData(response);
        
        }
      } catch (error) {
        console.error("Error fetching subscription status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [userInfo?.companyId]);

  // --- Management Handlers ---
  const handleUpgradePlan = () => {
    navigate("/upgrade-plan");
  };

  const handleTransactions = () => {
    navigate("/subscription-transactions");
  };

  // Check if there's an active subscription
  const hasActiveSubscription = subscriptionData && subscriptionData.active_subscription;

  // Get active subscription details
  const activeSubscription = hasActiveSubscription ? subscriptionData.active_subscription : null;

  return (
    <>
      <div className="p-4 my-4 space-y-6">
          <h5 className="text-xl">Subscription Management</h5>
        <div>
          {/* Subscription Status Card */}
          <div className="bg-white shadow overflow-hidden rounded-md mb-6">
            <div className="px-4 py-5 sm:px-6">
              <div className="border-b pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900">Subscription Status</h2>

                {loading ? (
                  <div className="animate-pulse mt-4 flex space-x-4">
                    <div className="rounded-full bg-slate-200 h-12 w-12"></div>
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ) : hasActiveSubscription ? (
                  <div className="mt-4">
                    <div className="flex items-center">
                      <div className="mr-3 bg-blue-100 p-2 rounded-full">
                        <Icon icon="heroicons:check-badge" className="text-blue-600" width="24" height="24" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-800">
                          {activeSubscription.billing_cycle === "yearly" ? "Annual" : "Monthly"} Premium Subscription
                        </p>
                        <p className="text-sm text-gray-500">
                          {activeSubscription.quantity} user{activeSubscription.quantity !== 1 ? 's' : ''} included
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 text-sm bg-green-50 text-green-700 py-2 px-3 rounded-md">
                      Your free premium subscription is active until {formatDateToDDMMYYYY(activeSubscription.end_at)}. Enjoy all premium features!
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="flex items-center">
                      <div className="mr-3 bg-gray-100 p-2 rounded-full">
                        <Icon icon="heroicons:information-circle" className="text-gray-600" width="24" height="24" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-800">Free Plan</p>
                        <p className="text-sm text-gray-500">Limited features and capabilities</p>
                      </div>
                    </div>

                    <div className="mt-3 text-sm bg-blue-50 text-blue-700 py-2 px-3 rounded-md">
                      Upgrade to a premium plan to unlock additional features and increase user limits.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Only show two cards: Upgrade and Transactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white shadow rounded-md p-6 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                <Icon icon="ic:round-arrow-upward" width="24" height="24" />
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900 text-center">
                {hasActiveSubscription ? "Manage Subscription" : "Upgrade to Premium"}
              </h3>
              <p className="mt-1 text-lg text-gray-500 text-center">
                {hasActiveSubscription ? "Add users or change your plan" : "Get more features and better limits"}
              </p>
              <div className="mt-4">
                <button
                  onClick={handleUpgradePlan}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {hasActiveSubscription ? "Manage Plan" : "Upgrade Now"}
                </button>
              </div>
            </div>

            <div className="bg-white shadow rounded-md p-6 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                <Icon icon="heroicons:document-chart-bar" width="24" height="24" />
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900 text-center">
                Subscription Transactions
              </h3>
              <p className="mt-1 text-lg text-gray-500 text-center">
                View all subscription transactions and payment history.
              </p>
              <div className="mt-4">
                <button
                  onClick={handleTransactions}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View Transactions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageSubscription;
