import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useSelector } from "react-redux";

const SubscriptionDetails = () => {
  const { subscriptionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.auth.user);
  
  // Get subscription data from location state or fetch from API if not available
  const subscriptionData = location.state?.subscriptionData;
  const paymentType = location.state?.paymentType || "full_amount";
  const message = location.state?.message || "Subscription details";
  
  // Extract subscription details
  const subDetails = subscriptionData?.subscription_details || {};
  const pricePerUnit = subscriptionData?.price_per_unit || 0;
  const quantity = subscriptionData?.quantity || 0;
  const total = subscriptionData?.next_due_amount || 0;
  const status = subDetails?.status || "pending";
  const companyName = subDetails?.company?.company_name || userInfo?.companyName || "Your Company";
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };
  
  const startDate = formatDate(subDetails?.start_at);
  const endDate = formatDate(subDetails?.end_at);
  
  // Handle payment actions
  const handlePayNow = () => {
    if (subscriptionData?.short_url) {
      window.location.href = subscriptionData.short_url;
    }
  };
  
  // Handle cancel subscription
  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel this subscription?")) {
      // Navigate back to plans page
      navigate("/plans");
    }
  };
  
  // Handle go to dashboard
  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <Card>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Icon icon="heroicons-outline:document-text" className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{paymentType === "token_amount" ? "Subscription Modification" : "Subscription Details"}</h1>
          <p className="text-gray-600 mt-2">{message}</p>
        </div>
        
        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          <div className={`inline-flex items-center px-3 py-1 rounded-full ${
            status === 'active' ? 'bg-green-100 text-green-800' : 
            status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            <span className="w-2 h-2 rounded-full mr-2 ${
              status === 'active' ? 'bg-green-500' : 
              status === 'pending' ? 'bg-yellow-500' : 
              'bg-gray-500'
            }"></span>
            <span className="font-medium capitalize">{status}</span>
          </div>
        </div>
        
        {/* Subscription Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Subscription #{subscriptionId?.substring(0, 8)}</h2>
                <p className="opacity-90">{companyName}</p>
              </div>
              <div className="text-right mt-4 md:mt-0">
                <p className="text-sm opacity-90">Total Amount</p>
                <p className="text-2xl font-bold">₹{total.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Subscription Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Subscription Period</h3>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-sm text-blue-600">Start Date</p>
                    <p className="font-medium">{startDate}</p>
                  </div>
                  <Icon icon="heroicons-outline:arrow-narrow-right" className="text-gray-400" />
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-sm text-blue-600">End Date</p>
                    <p className="font-medium">{endDate}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Subscription Details</h3>
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per user:</span>
                    <span className="font-medium">₹{pricePerUnit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of users:</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between font-medium">
                    <span className="text-gray-800">Total:</span>
                    <span className="text-green-700">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Status */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <Icon icon="heroicons-outline:exclamation" className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Payment Required</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      {paymentType === "token_amount" ? 
                        "A token payment is required to authorize this subscription modification. Your full billing adjustment will be reflected in your next invoice." :
                        "Your subscription has been created but requires payment to be activated. Please complete the payment to activate your subscription."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {subscriptionData?.short_url && (
                <button 
                  onClick={handlePayNow}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <Icon icon="heroicons-outline:credit-card" className="w-5 h-5 mr-2" />
                  Pay Now
                </button>
              )}
              
              <button 
                onClick={handleGoToDashboard}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Icon icon="heroicons-outline:home" className="w-5 h-5 mr-2" />
                Go to Dashboard
              </button>
              
              <button 
                onClick={handleCancel} 
                className="py-3 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Icon icon="heroicons-outline:x" className="w-5 h-5 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>
        
        {/* Support Info */}
        <div className="text-center text-gray-500 text-sm">
          <p>Having trouble with your subscription?</p>
          <p>Contact our support team at <a href="mailto:support@example.com" className="text-blue-600 hover:underline">support@example.com</a></p>
        </div>
      </div>
    </Card>
  );
};

export default SubscriptionDetails; 