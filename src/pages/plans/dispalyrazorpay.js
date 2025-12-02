import { fetchPOST } from "@/store/api/apiSlice";
import { RAZORPAY_CONFIG, cleanRazorpayKey } from "@/config/razorpay.config";

const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const onPaymentSuccess = async (
  response,
  amount,
  currency,
  userInfo,
  userSize,
  plan,
  paymentPlan,
  navigate,
  isSubscription = false
) => {
  try {
    // Since we don't have a direct ID, we'll use the plan details to identify it
    const planIdentifier = {
      title: plan?.title,
      price: plan?.price,
      additional_users: plan?.additional_users
    };

    const amountInPaise = amount * 100;
    const payload = {
      orderDetails: {
        orderId: isSubscription ? response.razorpay_subscription_id : response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
        company_id: userInfo?.companyId,
        employee_id: userInfo?._id,
        amount: amountInPaise,
      },
      status: "done",
      amount: amount,
      employee_limit: userSize,
      plan_details: planIdentifier, // Send plan details instead of ID
      payment_plan: paymentPlan,
    };

    await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/api/handle_user_payment/`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const paymentDetails = {
      status: "success",
      orderId: isSubscription ? response.razorpay_subscription_id : response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      amount,
      currency,
      plan,
      payment_plan: paymentPlan,
    };

    if (typeof navigate === "function") {
      navigate("/PaymentStatus", { state: paymentDetails });
    } else {
      window.location.href = "/PaymentStatus";
    }
  } catch (error) {
    console.error("Error saving payment information:", error.message);
  }
};

const onPaymentFailure = async (
  response,
  amount,
  currency,
  userInfo,
  userSize,
  plan,
  paymentPlan,
  navigate,
  isSubscription = false
) => {
  try {
    // Since we don't have a direct ID, we'll use the plan details to identify it
    const planIdentifier = {
      title: plan?.title,
      price: plan?.price,
      additional_users: plan?.additional_users
    };

    const amountInPaise = amount * 100;
    const payload = {
      orderDetails: {
        orderId: isSubscription ? response.razorpay_subscription_id : response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
        company_id: userInfo?.companyId,
        employee_id: userInfo?._id,
        amount: amountInPaise,
      },
      status: "cancelled",
      employee_limit: userSize,
      plan_details: planIdentifier, // Send plan details instead of ID
      payment_plan: paymentPlan,
    };

    await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/api/handle_user_payment/`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const paymentDetails = {
      status: "fail",
      orderId: isSubscription ? response.razorpay_subscription_id : response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      amount,
      currency,
      plan,
      payment_plan: paymentPlan,
    };

    if (typeof navigate === "function") {
      navigate("/PaymentStatus", { state: paymentDetails });
    } else {
      window.location.href = "/PaymentStatus";
    }
  } catch (error) {
    console.error("Error saving payment information:", error.message);
  }
};

const displayRazorpay = async (
  subscriptionOrOrderId,
  amount,
  currency,
  userInfo,
  userSize,
  plan,
  paymentPlan,
  navigate,
  isSubscription = false
) => {
  // Clean and validate the Razorpay key
  const cleanedKey = cleanRazorpayKey(RAZORPAY_CONFIG.KEY);

  if (!cleanedKey) {
    console.error("Razorpay key is missing or invalid");

    return;
  }

  const res = await loadScript(RAZORPAY_CONFIG.CHECKOUT_SCRIPT_URL);

  if (!res) {
    console.error("Razorpay SDK failed to load. Are you connected to the internet?");
    return;
  }

  // Amount is expected to be in the base currency unit (rupees/dollars)
  // Convert to smallest unit (paise/cents) for Razorpay
  const amountInPaise = Math.round(amount * 100);

  const options = {
    key: cleanedKey,
    amount: amountInPaise,
    currency: currency,
    name: userInfo?.name,
    description: isSubscription
      ? `Subscription Payment for ${amount} ${currency}`
      : `Payment for ${amount} ${currency}`,
    image: userInfo?.logoUrl,
    handler: async (response) => {
      try {
        // Show processing modal
        document.dispatchEvent(new CustomEvent('razorpay:processing', { detail: true }));

        // Call the payment success API
        const paymentSuccessPayload = {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_subscription_id: isSubscription ? subscriptionOrOrderId : null,
          razorpay_order_id: !isSubscription ? response.razorpay_order_id : null,
          razorpay_signature: response.razorpay_signature,
          payment_type: 'full_amount',
          quantity: userSize
        };

        // Call the new success API endpoint
        const paymentSuccessResponse = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/api/razorpay/payment/success/`, {
          body: paymentSuccessPayload,
          headers: { "Content-Type": "application/json" },
        });

        // Determine the actual response object - might be directly or nested in data field
        const responseData = paymentSuccessResponse?.data || paymentSuccessResponse;

        // Hide processing modal
        document.dispatchEvent(new CustomEvent('razorpay:processing', { detail: false }));

        // Emit success event with payment details
        document.dispatchEvent(new CustomEvent('razorpay:success', {
          detail: {
            response: responseData,
            amount: responseData?.token_amount_rupees || responseData?.payment_amount ||
              responseData?.token_amount || responseData?.amount || amount,
            fullAmount: responseData?.full_amount || null,
            originalAmount: amount,
            userSize: userSize,
            paymentId: response.razorpay_payment_id,
            subscriptionId: isSubscription ? subscriptionOrOrderId : null,
            orderId: !isSubscription ? response.razorpay_order_id : null,
            signature: response.razorpay_signature,
            timestamp: new Date().toISOString()
          }
        }));
      } catch (error) {
        // Hide processing modal on error
        document.dispatchEvent(new CustomEvent('razorpay:processing', { detail: false }));

        console.error("Error in payment verification:", error.message);
        await onPaymentFailure(response, amount, currency, userInfo, userSize, plan, paymentPlan, navigate, isSubscription);
      }
    },
    prefill: { name: "", email: "", contact: "" },
    notes: { address: "" },
    theme: { color: RAZORPAY_CONFIG.THEME_COLOR },
  };

  if (isSubscription) {
    options.subscription_id = subscriptionOrOrderId;
  } else {
    options.order_id = subscriptionOrOrderId;
    options.callback_url = "/verify-payment/";
  }

  try {
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  } catch (error) {
    console.error("Error creating Razorpay instance:", error.message);
  }
};

export default displayRazorpay;