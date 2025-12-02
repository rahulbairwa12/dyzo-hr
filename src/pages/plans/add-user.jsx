import React, { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchPOST, fetchGET } from "@/store/api/apiSlice";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/ui/Modal";
import NewPlanSkeleton from "@/components/skeleton/planSkelaton";
import displayRazorpay from "./dispalyrazorpay";

const AddUsers = () => {
  const [userCount, setUserCount] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserLimit, setCurrentUserLimit] = useState(0);
  const [loadingLimit, setLoadingLimit] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  
  // Currency state variables
  const [currency, setCurrency] = useState("INR");
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [pricePerUser, setPricePerUser] = useState(75); // Set to ₹75 per user
  
  const userInfo = useSelector((state) => state.auth.user);
  const [subscription, setSubscription] = useState(null);
  const navigate = useNavigate();
  
  // Modal states
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState({ 
    status: "success", // success or error
    message: "" 
  });
  const [paymentDetails, setPaymentDetails] = useState({
    amount: 0,
    users: 0,
    timestamp: null
  });
  
  // Maximum users constant
  const MAX_USERS = 100;

  const [showProcessingModal, setShowProcessingModal] = useState(false);

  // Fetch all data (company and subscription)
  useEffect(() => {
    const fetchAllData = async () => {
      setPageLoading(true);
      if (!userInfo?.companyId) {
        setPageLoading(false);
        return;
      }

      try {
        // Fetch company data
        setLoadingLimit(true);
        const companyResponse = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/company/${userInfo.companyId}/`);
        
        if (companyResponse && companyResponse.employee_limit !== undefined) {
          setCurrentUserLimit(companyResponse.employee_limit);
        }
        
        // Fetch subscription data using query parameters
        const subscriptionResponse = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/api/company/subscription/?company_id=${userInfo.companyId}`);
        
        // Check for active subscription with new response structure
        if (subscriptionResponse && subscriptionResponse.active_subscription) {
          setSubscription(subscriptionResponse.active_subscription);
          
          // If subscription has quantity, update the current user limit
          if (subscriptionResponse.active_subscription.quantity) {
            setCurrentUserLimit(subscriptionResponse.active_subscription.quantity);
          }
        } else if (subscriptionResponse && subscriptionResponse.pending_subscriptions && subscriptionResponse.pending_subscriptions.length > 0) {
          // Handle pending subscription
          const pendingSub = subscriptionResponse.pending_subscriptions[0];
          setSubscription(pendingSub);
          setError("You have a pending subscription awaiting payment or approval.");
        } else {
          setError("No active subscription found");
        }
        
        // Store Razorpay details if available
        if (subscriptionResponse && subscriptionResponse.razorpay_details) {
          // We can use this later if needed
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch subscription details");
      } finally {
        setLoadingLimit(false);
        setPageLoading(false);
      }
    };

    fetchAllData();
  }, [userInfo?.companyId]);

  // Add event listener for the payment processing event
  useEffect(() => {
    const handlePaymentProcessing = (event) => {
      setShowProcessingModal(event.detail);
    };
    
    document.addEventListener('razorpay:processing', handlePaymentProcessing);
    
    return () => {
      document.removeEventListener('razorpay:processing', handlePaymentProcessing);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      const numValue = parseInt(value) || 0;
      if (numValue > MAX_USERS) {
        setError(`Maximum ${MAX_USERS} users allowed`);
        setUserCount(MAX_USERS);
      } else {
        setUserCount(numValue);
        setError("");
      }
      setSuccess(false);
    }
  };

  // Calculate total cost based on user count
  const calculateTotalCost = () => {
    return Math.round(userCount * pricePerUser * 100) / 100;
  };

  const handleConfirmAdd = () => {
    const count = parseInt(userCount, 10);
    if (!count || count < 1) {
      setError("Please enter a valid number of users (at least 1)");
      return;
    }

    if (count > MAX_USERS) {
      setError(`Maximum ${MAX_USERS} users allowed`);
      return;
    }

    if (!subscription) {
      setError("No active subscription found. Please contact support.");
      return;
    }

    // Show confirmation modal
    setShowConfirmationModal(true);
  };

  const handleAdd = async () => {
    // Close confirmation modal
    setShowConfirmationModal(false);

    // Set loading state
    setLoading(true);
    setError("");
    
    try {
      // Calculate total amount for new users
      const totalAmount = userCount * pricePerUser;
      
      // Calculate new total users
      const totalUsers = currentUserLimit + userCount;
   
      // Use the subscription modification API endpoint for existing subscribers
      const updateResponse = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/api/company/subscription/modify/`, {
        body: {
          company_id: userInfo?.companyId,
          quantity: totalUsers,
          razorpay_plan_id: "plan_QRDPtjNeUvPyHJ",
          employee_id: userInfo?._id,
          currency: currency,
          token_amount: totalCost,
          payment_type: "token_amount",
          // Optional: Set to true to immediately cancel previous subscription
          cancel_previous: false
        }
      });

      if (updateResponse) {
        // Check for activation errors
        if (updateResponse.error) {
          throw new Error(updateResponse.error);
        }

        // Log the API response for debugging
        console.log("Subscription API response:", updateResponse);
        
        // Show success message
        toast.success(updateResponse.message || "Processing subscription update...");
        
        // Handle the case where razorpay_subscription_id is directly in the response (main case from API)
        if (updateResponse.razorpay_subscription_id) {
          // Use token amount if available, otherwise use full amount
          const paymentAmount = updateResponse.payment_type === "token_amount" ? 
            updateResponse.token_amount : 
            updateResponse.full_amount || totalAmount;
          
          console.log("Opening Razorpay for subscription:", updateResponse.razorpay_subscription_id);
          console.log("Payment amount:", paymentAmount);
          
          try {
            // Use displayRazorpay for payment
            await displayRazorpay(
              updateResponse.razorpay_subscription_id,
              paymentAmount,
              currency,
              userInfo,
              userCount,
              {
                title: `${updateResponse.payment_type === "token_amount" ? "Token payment for " : ""}Additional Users Subscription`,
                description: `Payment for ${userCount} additional user${userCount !== 1 ? 's' : ''}`,
                subscription_id: updateResponse.razorpay_subscription_id,
                plan_id: "plan_QRDPtjNeUvPyHJ",
                quantity: userCount,
                currency: currency,
                price_per_unit: pricePerUser
              },
              "monthly",
              navigate,
              true
            );
            
            // If subscription details are available, update the state
            if (updateResponse.subscription_details) {
              setSubscription(updateResponse.subscription_details);
              setCurrentUserLimit(updateResponse.subscription_details.quantity);
            }
            
            // Set payment details for success modal
            setPaymentDetails({
              amount: paymentAmount,
              users: userCount,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.error("Error opening Razorpay:", error);
            throw new Error("Failed to open payment window. Please try again.");
          }
          return;
        }
        // Handle nested data structure
        else if (updateResponse.status === 1 && updateResponse.data) {
          // If we have subscription details in the data with subscription_id
          if (updateResponse.data.subscription_id) {
            try {
              // Use displayRazorpay instead of redirecting
              await displayRazorpay(
                updateResponse.data.subscription_id,
                totalAmount, // Use the actual cost of added users
                currency,
                userInfo,
                userCount, // Send number of users being added
                {
                  title: `Additional Users Subscription`,
                  description: `Payment for ${userCount} additional user${userCount !== 1 ? 's' : ''}`,
                  subscription_id: updateResponse.data.subscription_id,
                  plan_id: "plan_QRDPtjNeUvPyHJ",
                  quantity: userCount,
                  currency: currency,
                  price_per_unit: pricePerUser
                },
                "monthly", // Using monthly as default billing cycle for additional users
                navigate,
                true // This is a subscription
              );
              
              // After Razorpay returns successfully, set updated subscription data
              if (updateResponse.data.subscription_details) {
                setSubscription(updateResponse.data.subscription_details);
                setCurrentUserLimit(updateResponse.data.quantity);
              }
              
              // Set payment details for success modal
              setPaymentDetails({
                amount: totalAmount,
                users: userCount,
                timestamp: new Date().toISOString()
              });
              
              setSuccess(true);
              setUserCount(1);
              setShowSuccessModal(true);
            } catch (error) {
              console.error("Error opening Razorpay:", error);
              throw new Error("Failed to open payment window. Please try again.");
            }
            return;
          }
          
          // Set updated subscription data from response
          if (updateResponse.data.subscription_details) {
            setSubscription(updateResponse.data.subscription_details);
            setCurrentUserLimit(updateResponse.data.quantity);
            
            // Set payment details for success modal
            setPaymentDetails({
              amount: updateResponse.data.next_due_amount || totalAmount,
              users: userCount,
              timestamp: new Date().toISOString()
            });
            
            setSuccess(true);
            setUserCount(1);
            setShowSuccessModal(true);
          }
        } 
        // Handle old response structure for backward compatibility
        else if (updateResponse.razorpay_short_url) {
          // Instead of redirecting, try to extract subscription ID and use displayRazorpay
          const subscriptionId = updateResponse.subscription_id || updateResponse.old_subscription_id;
          if (subscriptionId) {
            try {
              await displayRazorpay(
                subscriptionId,
                totalAmount,
                currency,
                userInfo,
                userCount,
                {
                  title: `Additional Users Subscription`,
                  description: `Payment for ${userCount} additional user${userCount !== 1 ? 's' : ''}`,
                  subscription_id: subscriptionId,
                  plan_id: "plan_QRDPtjNeUvPyHJ",
                  quantity: userCount,
                  currency: currency
                },
                "monthly",
                navigate,
                true
              );
            } catch (error) {
              console.error("Error opening Razorpay:", error);
              // Fallback to short URL if Razorpay popup fails
              toast.info("Opening payment page...");
              window.location.href = updateResponse.razorpay_short_url;
            }
          } else {
            // No subscription ID, fall back to short URL
            toast.info("Opening payment page...");
            window.location.href = updateResponse.razorpay_short_url;
          }
          return;
        }
        // If we have active subscription data in the response without payment needed
        else if (updateResponse.active_subscription) {
          setSubscription(updateResponse.active_subscription);
          setCurrentUserLimit(updateResponse.active_subscription.quantity);
          
          // If no payment URL, assume it was processed successfully
          setPaymentDetails({
            amount: totalAmount,
            users: userCount,
            timestamp: new Date().toISOString()
          });
          
          setSuccess(true);
          setUserCount(1);
          setShowSuccessModal(true);
        }
      } else {
        throw new Error("Failed to update subscription");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      setPaymentResult({
        status: "error",
        message: error.message || "Failed to update subscription quantity"
      });
      setShowResultModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
  };

  if (pageLoading) {
    return <NewPlanSkeleton />;
  }

  const totalCost = calculateTotalCost();

  const totalUsers = currentUserLimit + userCount;

  // Check if subscription is active
  const isSubscriptionActive = subscription && subscription.status === "active";
  
  // Get subscription details for display
  const subscriptionId = subscription ? subscription.id || "N/A" : "N/A";
  const subscriptionStatus = subscription ? subscription.status || "Unknown" : "Unknown";
  const basePrice = subscription && subscription.base_price ? 
    parseFloat(subscription.base_price).toFixed(2) : pricePerUser.toFixed(2);

  return (
    <Card>
      <div className="w-full bg-white">
        <div className="max-w-4xl mx-auto py-6 px-4">
          {/* Header with currency information */}
          <div className="text-center mb-6">
            <h2 className="font-lato font-extrabold text-3xl leading-tight tracking-tight text-gray-900 mb-2">
              Add Extra Users
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Expand your team's capabilities by adding more users to your current subscription.
            </p>
            
            {/* Subscription Status Indicator */}
            {subscription && (
              <div className="mt-2 inline-flex items-center px-3 py-1 bg-green-50 border border-green-100 rounded-full text-sm text-green-600">
                <span className="mr-1">Subscription Status:</span>
                <span className={`font-semibold ${isSubscriptionActive ? "text-green-600" : "text-amber-600"}`}>
                  {subscriptionStatus}
                </span>
              </div>
            )}
            
            {/* Currency Indicator */}
            <div className="mt-3 inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-sm text-blue-600">
              <span className="mr-1">Prices shown in</span>
              <span className="font-semibold">INR</span>
              <span className="mx-1">•</span>
              <span className="font-semibold">₹75 per user</span>
            </div>
          </div>

          {!isSubscriptionActive && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-md">
              <div className="flex items-center">
                <Icon icon="heroicons-outline:exclamation" className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-amber-700 font-medium">
                  You must have an active subscription to add users. 
                  <button onClick={() => navigate('/plans')} className="ml-1 text-amber-600 underline hover:text-amber-800">
                    Purchase a subscription
                  </button>
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Current User Limit Card */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl shadow-sm border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-purple-600">Current User Limit</div>
                  <Icon icon="heroicons-outline:users" className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {loadingLimit ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `${currentUserLimit} users`
                  )}
                </div>
                {subscription && (
                  <div className="text-xs text-purple-600 mt-1">
                    Subscription ID: {subscription.id || subscription.current_sub_id || "N/A"}
                    {subscription.current_sub_id && (
                      <span className="ml-2">Razorpay ID: {subscription.current_sub_id}</span>
                    )}
                  </div>
                )}
              </div>

              {/* User Input Card */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How many users would you like to add?
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        max={MAX_USERS}
                        value={userCount}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-4 pr-12 text-lg font-semibold border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        disabled={!isSubscriptionActive}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        users
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setUserCount(Math.max(1, userCount - 1))}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg border-2 border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors ${!isSubscriptionActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!isSubscriptionActive}
                      >
                        <Icon icon="heroicons-outline:minus" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setUserCount(Math.min(MAX_USERS, userCount + 1))}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg border-2 border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors ${!isSubscriptionActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!isSubscriptionActive}
                      >
                        <Icon icon="heroicons-outline:plus" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Total Users Calculation */}
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <div className="text-sm text-blue-600 mb-1">Total Users After Addition</div>
                  <div className="flex items-center justify-center gap-2 text-lg font-bold text-blue-800">
                    {loadingLimit ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      <>
                        <span className="bg-white px-2 py-0.5 rounded-md shadow-sm">{currentUserLimit}</span>
                        <span className="text-blue-400">+</span>
                        <span className="bg-white px-2 py-0.5 rounded-md shadow-sm">{userCount}</span>
                        <span className="text-blue-400">=</span>
                        <span className="bg-blue-100 px-2 py-0.5 rounded-md">{totalUsers}</span>
                        <span className="text-sm text-blue-600">users</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Price Display */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">Total Cost</div>
                  <div className="text-2xl font-bold text-gray-900 mb-0.5">
                    ₹{totalCost.toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm text-green-600">
                    ≈ ₹75 per user
                  </div>
                </div>

                {error && (
                  <div className="mt-3 p-2 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mt-3 p-2 bg-green-50 text-green-600 rounded-lg text-sm">
                    Users added successfully!
                  </div>
                )}
              
                <button
                  className={`w-full mt-4 py-3 ${
                    loading || !isSubscriptionActive ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                  } text-white rounded-lg transition duration-300 font-medium text-base disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                  onClick={handleConfirmAdd}
                  disabled={!userCount || userCount < 1 || loading || userCount > MAX_USERS || loadingLimit || !isSubscriptionActive}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Icon icon="heroicons-outline:refresh" className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Add ${userCount} User${userCount !== 1 ? 's' : ''} (₹${totalCost})`
                  )}
                </button>
              </div>
            </div>

            {/* Right Column - Features */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="heroicons-outline:sparkles" className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-bold text-gray-900">Included Features</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-7 h-7 flex items-center justify-center bg-purple-100 rounded-full mr-3">
                    <Icon icon="heroicons-outline:chart-bar" className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Live Reporting</div>
                    <div className="text-xs text-gray-500">Real-time analytics and insights</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-7 h-7 flex items-center justify-center bg-purple-100 rounded-full mr-3">
                    <Icon icon="heroicons-outline:camera" className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Unlimited Screenshots</div>
                    <div className="text-xs text-gray-500">Capture and store unlimited screenshots</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-7 h-7 flex items-center justify-center bg-purple-100 rounded-full mr-3">
                    <Icon icon="heroicons-outline:puzzle" className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Chrome Extension</div>
                    <div className="text-xs text-gray-500">Seamless browser integration</div>
                    <a
                      href="https://chromewebstore.google.com/detail/lajocdihefihpcidhehkiodaibaibjaf?utm_source=item-share-cb"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-1 text-xs text-purple-600 hover:text-purple-700"
                    >
                      <Icon icon="heroicons-outline:download" className="w-3 h-3 mr-1" />
                      Download Extension
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Subscription Details Section */}
              {subscription && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon icon="heroicons-outline:document-text" className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-bold text-gray-900">Subscription Details</h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${subscription.status === "active" ? "text-green-600" : "text-amber-600"}`}>
                        {subscription.status || "Unknown"}
                      </span>
                    </div>
                    
                    {subscription.start_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started:</span>
                        <span className="font-medium">
                          {new Date(subscription.start_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {subscription.end_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Billing:</span>
                        <span className="font-medium">
                          {new Date(subscription.end_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Users:</span>
                      <span className="font-medium">{subscription.quantity || currentUserLimit}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Price:</span>
                      <span className="font-medium">{currencySymbol}{basePrice}/user</span>
                    </div>
                    
                    {subscription.total_amount && (
                      <div className="flex justify-between text-green-700">
                        <span className="font-medium">Total Amount:</span>
                        <span className="font-bold">{currencySymbol}{parseFloat(subscription.total_amount).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-2xl p-8 sm:p-10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon icon="heroicons-outline:question-mark-circle" className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Confirm User Addition</h3>
              <p className="text-gray-600 mt-2">
                Are you sure you want to add <span className="font-bold text-blue-600">{userCount}</span> 
                new user{userCount !== 1 ? 's' : ''} to your subscription?
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Current users:</span>
                <span className="font-semibold">{currentUserLimit}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Users to add:</span>
                <span className="font-semibold text-blue-600">+{userCount}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                <span className="text-gray-700 font-medium">New total:</span>
                <span className="font-bold">{totalUsers} users</span>
              </div>
              
              <div className="mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
                <p>
                  <strong>Note:</strong> This modification will require a ₹5 token payment to authorize the change. 
                  Your full billing adjustment will be reflected in your next invoice.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAdd}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="w-full py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8 sm:p-10 flex flex-col justify-center">
            {/* Animated Checkmark */}
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-green-500 opacity-30 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-2 border-green-500 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                  <Icon icon="heroicons-outline:check" className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Users Added Successfully!</h2>
            <p className="text-gray-600 mb-6 text-center">Your subscription has been updated.</p>
            
            {/* Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4 text-left border border-gray-200">
              <div>
                <p className="text-sm text-gray-500">New Users</p>
                <p className="text-xl font-semibold text-gray-800">{paymentDetails.users}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-xl font-semibold text-gray-800">{totalUsers}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Updated On</p>
                <p className="text-sm font-medium text-gray-800">
                  {paymentDetails.timestamp && new Date(paymentDetails.timestamp).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/plans');
                }}
                className="w-full py-3 border border-green-200 text-green-700 hover:bg-green-50 rounded-lg font-medium transition-colors"
              >
                View Subscription Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      <Modal
        title="Error"
        activeModal={showResultModal}
        onClose={() => setShowResultModal(false)}
      >
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-red-100">
            <Icon icon="heroicons-outline:exclamation" className="w-10 h-10 text-red-600" />
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Operation Failed</h3>
            <p className="text-gray-600">{paymentResult.message}</p>
          </div>
          
          <button
            onClick={() => setShowResultModal(false)}
            className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </Modal>

      {/* Payment Processing Modal */}
      {showProcessingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 overflow-hidden transition-all transform">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#7A39FF] mb-4"></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Processing Payment</h3>
              <p className="text-gray-600 text-center mb-2">
                Please wait while we process your payment...
              </p>
              <p className="text-sm text-gray-500 text-center">
                Do not close this window or refresh the page.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AddUsers; 