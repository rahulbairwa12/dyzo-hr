import React, { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchPOST, fetchGET } from "@/store/api/apiSlice";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/ui/Modal";
import NewPlanSkeleton from "@/components/skeleton/planSkelaton";
import Textinput from "@/components/ui/Textinput";

const ModifySubscription = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userQuantity, setUserQuantity] = useState(0);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [currentQuantity, setCurrentQuantity] = useState(0);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [mandatePollingInterval, setMandatePollingInterval] = useState(null);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  
  // Fixed price per user
  const pricePerUser = 0.10; // $0.10 per user

  const userInfo = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  // Razorpay script loading state
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  // Load Razorpay SDK
  useEffect(() => {
    const loadRazorpayScript = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setIsRazorpayLoaded(true);
      document.body.appendChild(script);
    };
    
    loadRazorpayScript();
    
    return () => {
      // Cleanup mandate polling if component unmounts
      if (mandatePollingInterval) {
        clearInterval(mandatePollingInterval);
      }
    };
  }, []);

  // Fetch subscription data on component mount
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!userInfo?.companyId) {
        setPageLoading(false);
        return;
      }

      try {
        setPageLoading(true);
        const subscriptionResponse = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/api/razorpaysubscription/company/${userInfo.companyId}/`);
        
        if (subscriptionResponse.subscriptions && subscriptionResponse.subscriptions.length > 0) {
          const subscription = subscriptionResponse.subscriptions[0];
          setSubscriptionDetails(subscription);
          
          // Set current plan and quantity
          if (subscription.subscription) {
            setCurrentPlanId(subscription.subscription.plan_id || '');
            setCurrentQuantity(subscription.subscription.quantity || 0);
            setUserQuantity(subscription.subscription.quantity || 0);
          }
        } else {
          setError("No active subscription found");
        }

        // Fetch available plans
        const plansResponse = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/api/razorpay/plans/`);
        if (plansResponse && plansResponse.data && Array.isArray(plansResponse.data)) {
          setPlans(plansResponse.data);
        }

      } catch (error) {
        console.error("Error fetching subscription details:", error);
        setError("Failed to load subscription details");
      } finally {
        setPageLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [userInfo?.companyId]);

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setUserQuantity(Math.max(value, 1)); // Ensure at least 1 user
  };

  // Handle plan selection
  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  // Calculate price difference based on changes
  const calculatePriceDifference = () => {
    // If no change in plan and quantity remains the same, no difference
    if (!selectedPlan && userQuantity === currentQuantity) return 0;
    
    let newPrice = userQuantity * pricePerUser;
    let currentPrice = currentQuantity * pricePerUser;
    
    // In a real app, you would calculate based on the selected plan's pricing
    // This is a simplified calculation
    return Math.round((newPrice - currentPrice) * 100) / 100;
  };

  // Show confirmation modal before proceeding with changes
  const handleShowConfirmation = () => {
    // Validate changes
    if (userQuantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }
    
    // Check if any changes were made
    if (!selectedPlan && userQuantity === currentQuantity) {
      toast.warning("No changes detected. Please modify quantity or select a different plan.");
      return;
    }

    setShowConfirmationModal(true);
  };

  // Handle the subscription update
  const handleUpdateSubscription = async () => {
    setLoading(true);
    setError("");
    setShowConfirmationModal(false);

    try {
      if (!subscriptionDetails?.subscription?.subscription_id) {
        throw new Error("Subscription ID not found");
      }

      const payload = {
        subscription_id: subscriptionDetails.subscription.subscription_id
      };

      // Only include fields that are being changed
      if (selectedPlan) {
        payload.plan_id = selectedPlan;
      }
      
      if (userQuantity !== currentQuantity) {
        payload.quantity = userQuantity;
      }

      // Call the modify subscription API
      const response = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/api/razorpay/subscriptions/modify/`, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });

      if (response.status === 'success') {
        // Check if mandate verification is required
        if (response.data.requires_mandate_verification) {
          // Handle mandate verification
          handleMandateVerification(response.data);
        } else {
          // If no verification needed, show success
          setShowSuccessModal(true);
        }
      } else {
        throw new Error(response.message || "Failed to update subscription");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      setErrorDetails(error.message || "An unexpected error occurred");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Razorpay mandate verification flow
  const handleMandateVerification = (data) => {
    const { verification_details, subscription_id } = data;
    
    // If short_url is available, redirect to Razorpay hosted page
    if (verification_details && verification_details.short_url) {
      window.location.href = verification_details.short_url;
      return;
    }
    
    // Otherwise use client-side verification with Razorpay checkout
    if (!isRazorpayLoaded) {
      toast.error("Payment gateway is not loaded properly. Please refresh the page.");
      return;
    }
    
    /**
     * Create Razorpay checkout instance for mandate re-authentication
     * 
     * This is a special flow for subscription modifications that require
     * re-authentication of the customer's payment mandate (typically via OTP).
     * 
     * For subscription modifications like increasing users or changing plans,
     * Razorpay requires a new authorization from the user via the checkout modal.
     */
    const options = {
      key: "rzp_test_a0EbFggOZJRGVr", // Replace with your Razorpay key
      name: "PwPulse",
      description: "Subscription Modification",
      subscription_id: subscription_id,
      mandate_id: verification_details?.mandate_id,
      modal: {
        escape: false,
        ondismiss: function() {
          // Start polling for mandate status when modal is dismissed
          // This is critical because the user may complete authentication outside the modal
          startMandateStatusPolling(subscription_id);
        }
      },
      handler: function(response) {
        // When the user completes the authentication, check mandate status
        checkMandateStatus(subscription_id, true);
      },
      prefill: {
        name: userInfo?.name || `${userInfo?.first_name} ${userInfo?.last_name}`,
        email: userInfo?.email,
        contact: userInfo?.phone || ""
      },
      theme: {
        color: "#7A39FF"
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Razorpay initialization error:", error);
      setErrorDetails("Failed to initialize payment verification");
      setShowErrorModal(true);
    }
  };

  // Start polling for mandate status
  const startMandateStatusPolling = (subscription_id) => {
    toast.info("Verifying mandate status...");
    
    // Clear any existing polling
    if (mandatePollingInterval) {
      clearInterval(mandatePollingInterval);
    }
    
    /**
     * Poll the mandate status API regularly to check if the user completed
     * their authentication outside our app (common with bank OTP flows).
     * 
     * We check every 3 seconds for up to 2 minutes, which should be enough
     * time for users to complete the process.
     */
    const intervalId = setInterval(() => {
      checkMandateStatus(subscription_id);
    }, 3000);
    
    setMandatePollingInterval(intervalId);
    
    // Stop polling after 2 minutes (safeguard)
    setTimeout(() => {
      clearInterval(intervalId);
      setMandatePollingInterval(null);
      toast.warn("Verification timed out. Please check your subscription status.");
    }, 120000);
  };

  // Check mandate authentication status
  const checkMandateStatus = async (subscription_id, isInitialCheck = false) => {
    try {
      // Call the API endpoint to check mandate status
      const response = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/api/razorpay/subscriptions/check-mandate/?subscription_id=${subscription_id}`);
      
      if (response.status === 'success') {
        const { data } = response;
        
        // If authentication is complete or not required anymore
        if (!data.requires_mandate_verification || data.authentication_status === 'verified') {
          // Stop polling
          if (mandatePollingInterval) {
            clearInterval(mandatePollingInterval);
            setMandatePollingInterval(null);
          }
          
          // Show success
          setShowSuccessModal(true);
        } else if (isInitialCheck) {
          // Start polling only if this is the first check
          startMandateStatusPolling(subscription_id);
        }
      }
    } catch (error) {
      console.error("Error checking mandate status:", error);
      // Don't stop polling on error, just log it
    }
  };

  const priceDifference = calculatePriceDifference();

  if (pageLoading) {
    return <NewPlanSkeleton />;
  }

  return (
    <Card>
      <div className="w-full bg-white">
        <div className="max-w-4xl mx-auto py-6 px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-lato font-extrabold text-3xl leading-tight tracking-tight text-gray-900 mb-2">
              Modify Subscription
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Update your subscription by changing the number of users or selecting a different plan.
            </p>
            
            {/* Currency Indicator */}
            <div className="mt-3 inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-sm text-blue-600">
              <span className="mr-1">Prices shown in</span>
              <span className="font-semibold">USD</span>
              <span className="mx-1">•</span>
              <span className="font-semibold">$0.10 per user</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          {subscriptionDetails && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Current Subscription */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                    <Icon icon="heroicons-outline:clipboard-check" className="w-6 h-6 mr-2 text-blue-600" />
                    Current Subscription
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-800">Status</span>
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        subscriptionDetails.subscription?.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {subscriptionDetails.subscription?.status || 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Current Plan</span>
                      <span className="font-medium">{subscriptionDetails.plan_name || 'Standard Plan'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Users</span>
                      <span className="font-medium">{subscriptionDetails.subscription?.quantity || 0}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Current Period</span>
                      <span className="font-medium">
                        {subscriptionDetails.subscription?.current_start 
                          ? new Date(subscriptionDetails.subscription.current_start * 1000).toLocaleDateString() 
                          : '-'} to {
                          subscriptionDetails.subscription?.current_end 
                            ? new Date(subscriptionDetails.subscription.current_end * 1000).toLocaleDateString() 
                            : '-'
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-purple-800">Next Billing</span>
                      <span className="font-medium text-purple-800">
                        {subscriptionDetails.subscription?.charge_at 
                          ? new Date(subscriptionDetails.subscription.charge_at * 1000).toLocaleDateString() 
                          : 'Not scheduled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Modify Options */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                    <Icon icon="heroicons-outline:pencil-alt" className="w-6 h-6 mr-2 text-purple-600" />
                    Modify Subscription
                  </h3>
                  
                  <div className="space-y-5">
                    {/* User Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Users
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="1"
                            value={userQuantity}
                            onChange={handleQuantityChange}
                            className="w-full h-12 pl-4 pr-12 text-lg font-semibold border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                            users
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setUserQuantity(Math.max(1, userQuantity - 1))}
                            className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <Icon icon="heroicons-outline:minus" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setUserQuantity(userQuantity + 1)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <Icon icon="heroicons-outline:plus" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {userQuantity > currentQuantity 
                          ? `Adding ${userQuantity - currentQuantity} users` 
                          : userQuantity < currentQuantity 
                            ? `Removing ${currentQuantity - userQuantity} users` 
                            : 'No change in users'}
                      </p>
                    </div>
                    
                    {/* Plan Selection */}
                    {plans.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Plan
                        </label>
                        <div className="grid gap-3">
                          {plans.map(plan => (
                            <div 
                              key={plan.id}
                              onClick={() => handlePlanSelect(plan.id)}
                              className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                selectedPlan === plan.id 
                                  ? 'border-purple-500 bg-purple-50' 
                                  : currentPlanId === plan.id
                                    ? 'border-gray-300 bg-gray-50'
                                    : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className={`w-5 h-5 rounded-full mr-3 border ${
                                    selectedPlan === plan.id 
                                      ? 'border-purple-500 bg-purple-500' 
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedPlan === plan.id && (
                                      <Icon icon="heroicons-outline:check" className="w-5 h-5 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{plan.name || 'Standard Plan'}</h4>
                                    <p className="text-xs text-gray-500">${plan.amount / 100}/user/month</p>
                                  </div>
                                </div>
                                {currentPlanId === plan.id && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Current</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Price Summary */}
                    <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-700">Current Cost</span>
                        <span className="font-medium">${(currentQuantity * pricePerUser).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-700">New Cost</span>
                        <span className="font-medium">${(userQuantity * pricePerUser).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-purple-200">
                        <span className="font-medium text-gray-800">Difference</span>
                        <span className={`font-bold ${priceDifference > 0 ? 'text-orange-600' : priceDifference < 0 ? 'text-green-600' : 'text-gray-800'}`}>
                          {priceDifference > 0 ? '+' : ''}{priceDifference.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <button
                      onClick={handleShowConfirmation}
                      disabled={loading || (!selectedPlan && userQuantity === currentQuantity)}
                      className={`w-full py-3 mt-4 ${
                        loading || (!selectedPlan && userQuantity === currentQuantity)
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                      } text-white rounded-lg font-medium transition duration-300 shadow-md hover:shadow-lg`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <Icon icon="heroicons-outline:refresh" className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        'Update Subscription'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Important Notes */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="flex items-center text-yellow-800 font-medium mb-2">
              <Icon icon="heroicons-outline:exclamation" className="w-5 h-5 mr-2" />
              Important Information
            </h4>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              <li>Subscription changes may require authentication via OTP.</li>
              <li>Changes to user quantity are effective immediately.</li>
              <li>Plan changes may affect billing cycle and features.</li>
              <li>You will be billed or credited for prorated differences.</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon icon="heroicons-outline:question-mark-circle" className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Confirm Subscription Update</h3>
              <p className="text-gray-600 mt-2">
                Are you sure you want to update your subscription?
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              {userQuantity !== currentQuantity && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">User count:</span>
                  <span className="font-semibold">
                    {currentQuantity} → {userQuantity} users
                  </span>
                </div>
              )}
              
              {selectedPlan && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-semibold">
                    Changing plan
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                <span className="text-gray-700 font-medium">Price change:</span>
                <span className={`font-bold ${priceDifference > 0 ? 'text-orange-600' : priceDifference < 0 ? 'text-green-600' : 'text-gray-800'}`}>
                  {priceDifference > 0 ? '+' : ''}{priceDifference.toFixed(2)} USD
                </span>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg mb-6 text-sm text-yellow-800">
              <p className="flex items-center">
                <Icon icon="heroicons-outline:exclamation-circle" className="w-5 h-5 mr-2 text-yellow-600" />
                You may be asked to complete authentication via OTP to verify this change.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleUpdateSubscription}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Confirm Update
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
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Subscription Updated Successfully!</h2>
            <p className="text-gray-600 mb-6 text-center">Your subscription has been modified as requested.</p>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4 text-left border border-gray-200">
              {userQuantity !== currentQuantity && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Previous Users</p>
                    <p className="text-xl font-semibold text-gray-800">{currentQuantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">New Users</p>
                    <p className="text-xl font-semibold text-gray-800">{userQuantity}</p>
                  </div>
                </>
              )}
              
              {selectedPlan && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Plan Changed</p>
                  <p className="text-sm font-medium text-gray-800">
                    Your plan has been updated successfully
                  </p>
                </div>
              )}
              
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Updated On</p>
                <p className="text-sm font-medium text-gray-800">
                  {new Date().toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  window.location.reload(); // Reload to show updated subscription
                }}
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
        activeModal={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      >
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-red-100">
            <Icon icon="heroicons-outline:exclamation" className="w-10 h-10 text-red-600" />
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Update Failed</h3>
            <p className="text-gray-600">{errorDetails}</p>
          </div>
          
          <button
            onClick={() => setShowErrorModal(false)}
            className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </Modal>
    </Card>
  );
};

export default ModifySubscription; 