/**
 * Razorpay Configuration
 * This file contains all Razorpay-related constants and configuration
 */

export const RAZORPAY_CONFIG = {
  // Razorpay API Key
  KEY: import.meta.env.VITE_APP_RAZORPAY_KEY_ID,
  
  // Plan IDs
  PLAN_ID_IN: "plan_QcfvDLZjySeQr6",      // India Plan
  PLAN_ID_GLOBAL: "plan_QcfuWipJaJaZnP",   // Global Plan
  
  // Theme color
  THEME_COLOR: "#F37254",
  
  // Razorpay Checkout Script URL
  CHECKOUT_SCRIPT_URL: "https://checkout.razorpay.com/v1/checkout.js"
};

/**
 * Get the appropriate plan ID based on user location
 * @param {boolean} isIndianUser - Whether the user is in India
 * @returns {string} The plan ID
 */
export const getPlanId = (isIndianUser = true) => {
  return isIndianUser ? RAZORPAY_CONFIG.PLAN_ID_IN : RAZORPAY_CONFIG.PLAN_ID_GLOBAL;
};

/**
 * Clean and validate Razorpay key
 * @param {string} key - The raw key
 * @returns {string} Cleaned key
 */
export const cleanRazorpayKey = (key) => {
  return key?.replace(/["\\]/g, '').trim();
};
