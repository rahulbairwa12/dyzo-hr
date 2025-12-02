import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

const PaymentStatus = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  console.log(state);

  // Expected state structure:
  // {
  //   status: "success" | "fail" | "pending",
  //   orderId: string,
  //   paymentId: string,
  //   amount: number,
  //   currency: string,
  //   plan: {
  //     title: string,
  //     description: string,
  //     price: number,
  //     team_size: string,
  //     storage: number,
  //   }
  // }
  const status = state?.status || "pending";
  const orderId = state?.orderId || "N/A";
  const paymentId = state?.paymentId || "N/A";
  const amount = state?.amount || 0;
  const currency = state?.currency || "INR";
  const plan = state?.plan || {};

  // Function to display storage in MB or GB without trailing decimals.
  const getStorageDisplay = () => {
    const storageValue = parseFloat(plan.storage);
    if (!isNaN(storageValue)) {
      if (storageValue >= 1024) {
        return `${Math.floor(storageValue / 1024)} GB`;
      } else {
        return `${Math.floor(storageValue)} MB`;
      }
    }
    return "N/A";
  };

  // Determine visual cues based on status.
  let statusColor, statusText, iconName, iconColor, animationClass;
  if (status === "success") {
    statusColor = "bg-green-100 border-green-500";
    statusText = "Payment Successful";
    iconName = "material-symbols:check-circle-outline";
    iconColor = "text-green-600";
    animationClass = "animate-pulse"; // Tailwind's pulse animation
  } else if (status === "fail") {
    statusColor = "bg-red-100 border-red-500";
    statusText = "Payment Failed";
    iconName = "material-symbols:error-outline";
    iconColor = "text-red-600";
    animationClass = "animate-shake"; // Custom shake animation
  } else {
    statusColor = "bg-yellow-100 border-yellow-500";
    statusText = "Payment Pending";
    iconName = "material-symbols:pending-actions";
    iconColor = "text-yellow-600";
    animationClass = "animate-bounce"; // Tailwind's bounce animation
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 p-4">
      <div className={`max-w-xl w-full p-8 rounded-xl shadow-2xl border-2 ${statusColor} animate-fadeIn`}>
        <div className="flex flex-col items-center">
          <Icon icon={iconName} width="80" height="80" className={`${iconColor} ${animationClass}`} />
          <h1 className="mt-4 text-3xl font-bold text-gray-800">{statusText}</h1>
          <p className="mt-2 text-gray-600 text-center">
            Thank you for choosing our service. Please find your payment and plan details below.
          </p>
        </div>

        <div className="mt-8 border-t border-gray-300 pt-4">
          <h2 className="text-2xl font-semibold text-gray-800">Plan Details</h2>
          <div className="mt-4 space-y-1 text-sm sm:text-base">
            <p><span className="font-bold">Plan:</span> {plan.title || "N/A"}</p>
            <p><span className="font-bold">Description:</span> {plan.description || "N/A"}</p>
            <p><span className="font-bold">Price:</span> ₹{plan.price || 0}</p>
            <p><span className="font-bold">Team Size:</span> {plan.team_size || "N/A"}</p>
            <p>
              <span className="font-bold">Storage:</span> {getStorageDisplay()}
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-300 pt-4">
          <h2 className="text-2xl font-semibold text-gray-800">Payment Details</h2>
          <div className="mt-4 space-y-1 text-sm sm:text-base">
            <p><span className="font-bold">Order ID:</span> {orderId}</p>
            <p><span className="font-bold">Amount:</span> ₹{amount} {currency}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
          <button
            onClick={() => navigate("/tasks")}
            className="px-6 py-3 bg-green-600 text-white rounded-full shadow hover:bg-green-700 transition duration-300"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() =>
              navigate("/user-transaction-history", { state: { orderId, paymentId, plan } })
            }
            className="px-6 py-3 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition duration-300"
          >
            Check Order Details
          </button>
        </div>
      </div>

      {/* Inline styles for custom animations */}
      <style jsx="true">{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default PaymentStatus;
