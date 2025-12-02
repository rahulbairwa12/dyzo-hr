import React from "react";
import { Icon } from "@iconify/react";

const LendingPagePlanCard = ({
  title,
  description,
  price,
  priceDescription,
  buttonText,
  recommended,
  storage,
  TotalBilling,
  handleCreateOrder,
  handleFreeAction,
  team_size,
  isStatic,          // For static Enterprise card
  handleStaticAction, // For static card button action
  isYearly,           // Indicates if billing period is yearly
  isCurrentPlan       // Indicates if this is the user's current plan
}) => {
  // Helper function to display storage in MB or GB.
  const getStorageDisplay = (storageValue) => {
    const val = parseFloat(storageValue);
    if (isNaN(val)) return "N/A";
    return val < 1000 ? `${Math.round(val)} MB` : `${Math.round(val / 1000)} GB`;
  };

  // Determine if this card is recommended.
  const isRecommended = recommended || title.toLowerCase() === "advanced";
  
  // If current, add an extra ring using theme colors.
  const additionalClass = isCurrentPlan ? "ring-4 ring-blue-500" : "";
  
  const cardClasses = `relative p-6 mx-auto text-center text-gray-900 bg-white rounded-lg ${additionalClass} ${
    isRecommended
      ? "border-2 border-blue-500 shadow-2xl hover:scale-105 transition-transform duration-300"
      : "border border-gray-100 shadow hover:scale-105 transition-transform duration-300"
  } dark:border-gray-600 xl:p-8 dark:bg-gray-800 dark:text-white flex flex-col justify-between min-h-[500px]`;

  return (
    <div className="mx-auto w-full">
      <div className={cardClasses}>
        {/* Current Plan Badge */}
        {isCurrentPlan && (
          <div className="absolute top-0 left-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-br shadow-lg">
            Current Plan
          </div>
        )}
        {/* Recommended Badge (only if not the current plan) */}
        {isRecommended && !isCurrentPlan && (
          <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl transform rotate-12 shadow-lg">
            Recommended
          </div>
        )}

        <h3 className="mb-4 text-2xl font-semibold">{title}</h3>
        <p className="text-gray-500 sm:text-lg dark:text-gray-400">{description}</p>

        <div className="flex justify-center items-baseline mt-8">
          {isStatic ? (
            <span className="mr-2 text-2xl font-bold">{price}</span>
          ) : (
            <span className="mr-2 text-4xl font-extrabold">
              {parseFloat(price) === 0 ? "Free" : "₹"}
              {parseFloat(price) === 0 ? "" : price}
            </span>
          )}
        </div>

        {priceDescription && (
          <span className="text-gray-500 dark:text-gray-500 flex justify-center items-baseline mt-3">
            {priceDescription}
          </span>
        )}

        {/* Action Button */}
        <button
          className={`${
            buttonText === "Your current plan"
              ? "bg-gradient-to-r from-blue-500 to-purple-600 opacity-60 cursor-not-allowed"
              : "btn-theme"
          } mt-4 font-medium text-sm text-center focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900`}
          onClick={() => {
            if (isStatic && handleStaticAction) {
              handleStaticAction();
            } else if (parseFloat(price) === 0) {
              if (handleFreeAction) handleFreeAction();
            } else if (handleCreateOrder) {
              handleCreateOrder(parseFloat(price), team_size);
            }
          }}
          disabled={buttonText === "Your current plan"}
        >
          {buttonText}
        </button>

        {TotalBilling && (
          <span className="text-black-500 dark:text-gray-500 mb-3 flex justify-center items-baseline mt-3">
            {TotalBilling}
          </span>
        )}

        <ul role="list" className="mb-2 space-y-4 text-left">
          {team_size && (
            <li className="flex items-center space-x-3">
              <Icon
                icon="ic:baseline-check"
                className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400"
              />
              <span>
                Team size: <span className="font-semibold">{team_size} User</span>
              </span>
            </li>
          )}
          {storage && (
            <li className="flex items-center space-x-3">
              <Icon
                icon="ic:baseline-check"
                className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400"
              />
              <span>
                Storage size:{" "}
                <span className="font-semibold">{getStorageDisplay(storage)}</span>
              </span>
            </li>
          )}
          <li className="flex items-center space-x-3">
            <Icon
              icon="ic:baseline-check"
              className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400"
            />
            <span>Live Reporting</span>
          </li>
          <li className="flex items-center space-x-3">
            <Icon
              icon="ic:baseline-check"
              className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400"
            />
            <span>Unlimited Screenshots</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LendingPagePlanCard;
