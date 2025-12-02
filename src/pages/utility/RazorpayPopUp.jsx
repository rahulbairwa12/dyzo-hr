import React, { useEffect, useRef, useState } from 'react';
import { fetchPOST } from '@/store/api/apiSlice';
import { useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { djangoBaseURL } from '@/helper';

const loadScript = (src) => {
    return new Promise((resolve) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            resolve(existingScript);
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            resolve(script);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

const RazorpayPopUp = ({ orderId, keyId, keySecret, currency, amount, closePopup, paymentPlan, sizeByInMb, setPaymentStatus }) => {
    const paymentId = useRef(null);
    const paymentMethod = useRef(null);
    const razorpayInstance = useRef(null); // Reference to store the Razorpay instance
    const userInfo = useSelector((state) => state?.auth.user);
    const navigate = useNavigate(); // Hook to navigate
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const displayRazorpay = async (options) => {
        if (!scriptLoaded) {
            const script = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
            if (!script) {
                return;
            }
            setScriptLoaded(true);
        }

        if (typeof window.Razorpay !== "undefined") {
            const rzp1 = new window.Razorpay(options);
            razorpayInstance.current = rzp1; // Store the Razorpay instance

            rzp1.on('payment.submit', (response) => { paymentMethod.current = response.method });

            rzp1.on('payment.failed', (response) => { 
                paymentId.current = response.error.metadata.payment_id; 
                setPaymentStatus('failed'); // Update status on failure
            });

            rzp1.open();
        } else {
            console.error("Razorpay is not available in the window object");
        }
    };

    const handlePayment = async (status, orderDetails = {}, response) => {
        try {
            if (!keySecret || !response || !response.razorpay_payment_id) {
                console.error('Invalid keySecret or response data');
                return;
            }

            const data = `${orderId}|${response.razorpay_payment_id}`;
            const hmac = CryptoJS.HmacSHA256(data, keySecret).toString(CryptoJS.enc.Hex);

            const verifyResponse = await fetchPOST(`${djangoBaseURL}/verify-payment/`, {
                body: {
                    orderDetails: {
                        orderId: orderId,
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                    }
                }
            });

            if (verifyResponse.status === 'success') {
                await fetchPOST(`${djangoBaseURL}/save-payment-info/`, {
                    body: {
                        razorpay_order_id: orderId,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        amount: amount,
                        company: userInfo.companyId,
                        employee: userInfo._id,
                        payment_plan: paymentPlan, // Pass payment plan (monthly/yearly)
                        sizeByInMb: sizeByInMb, // Pass storage size in MB
                        status: 'done', // Set status to done on success
                    }
                });
                setPaymentStatus('done'); // Update status on success
                if (razorpayInstance.current) {
                    razorpayInstance.current.close(); // Close the Razorpay modal
                }
                closePopup(); // Close the custom popup
                navigate('/allplans'); // Navigate to the storage page

                // Cleanup the Razorpay script
                const script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
                if (script) {
                    script.remove();
                }
                razorpayInstance.current = null; // Clear the Razorpay instance reference
                setScriptLoaded(false); // Reset the script loaded flag
            } else {
                setPaymentStatus('failed'); // Update status on verification failure
            }
        } catch (error) {
            setPaymentStatus('failed'); // Update status on error
            console.error('Error handling payment:', error);
        }
    };

    const options = {
        key: keyId,
        amount,
        currency,
        name: userInfo?.name,
        order_id: orderId,
        handler: (response) => {
            paymentId.current = response.razorpay_payment_id;

            try {
                const hmac = CryptoJS.HmacSHA256(`${orderId}|${response.razorpay_payment_id}`, keySecret).toString(CryptoJS.enc.Hex);

                if (hmac === response.razorpay_signature) {
                    handlePayment('succeeded', {
                        orderId,
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                    }, response);
                } else {
                    handlePayment('failed', {
                        orderId,
                        paymentId: response.razorpay_payment_id,
                    }, response);
                }
            } catch (error) {
                console.error('Error calculating HMAC:', error);
            }
        },
        modal: {
            confirm_close: true,
            ondismiss: async (reason) => {
                if (reason === undefined) {
                    setPaymentStatus('cancelled'); // Update status on cancellation
                    handlePayment('cancelled');
                } else if (reason === 'timeout') {
                    setPaymentStatus('timedout'); // Update status on timeout
                    handlePayment('timedout');
                } else {
                    setPaymentStatus('failed'); // Update status on failure
                    handlePayment('failed', reason);
                }
            },
        },
        retry: {
            enabled: false,
        },
        timeout: 900,
        theme: {
            color: '',
        },
    };

    useEffect(() => {
        displayRazorpay(options);
    }, []); // Ensure the useEffect is called only once

    return null;
};

export default RazorpayPopUp;
