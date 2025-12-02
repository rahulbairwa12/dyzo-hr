import { fetchAuthGET, fetchPOST } from '@/store/api/apiSlice';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import img1 from "@/assets/images/all-img/big-shap1.png";
import ProgressBar from '@/components/ui/ProgressBar';
import Grid from '@/components/skeleton/Grid';
import RazorpayPopUp from "./dispalyrazorpay"; // Import RazorpayPopUp component
import { useNavigate } from 'react-router-dom';

export default function UserLimit() {
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);  // Start with null to better handle loading state
    const [userPlan, setUserPlan] = useState(null);  // Start with null to better handle loading state
    const [latestPayment, setLatestPayment] = useState(null); // Store latest payment details
    const userInfo = useSelector((state) => state.auth.user);
    const [loading, setLoading] = useState(true);
    const [orderDetails, setOrderDetails] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [expiryDate, setExpiryDate] = useState(null); // Store expiry date
    const [showRazorpayPopup, setShowRazorpayPopup] = useState(false); // New state to control RazorpayPopUp visibility

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/company/${userInfo?.companyId}/details/`);
                if (data) {
                    const companyData = data.company || {};
                    const totalEmployees = companyData.total_employees || 0;
                    
                    // Set employee_limit to total_employees if it's not already set or is 0
                    companyData.employee_limit = companyData.employee_limit || totalEmployees;

                    setCompany(companyData);  // Update company state with the modified data
                    setUserPlan(data.user_plans?.[0] || {});  // Fallback to empty object if no user plan data
                    setLatestPayment(data.latest_payment || null); // Set latest payment data
                    
                    // Calculate expiry date (assuming a monthly plan)
                    if (data.latest_payment) {
                        const createdAt = new Date(data.latest_payment.created_at);
                        const expiry = new Date(createdAt.setMonth(createdAt.getMonth() + 1));
                        setExpiryDate(expiry.toLocaleDateString());
                    }
                }
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };

        if (userInfo?.companyId) {
            fetchData();
        }
    }, [userInfo?.companyId]);

    // Safely access company and userPlan data with fallback values
    const totalEmployee = company?.total_employees || 0;
    const employeeLimit = company?.employee_limit || 1;
    const percentage = employeeLimit > 0 ? ((totalEmployee / employeeLimit) * 100).toFixed(2) : 0;

    // Calculate total price based on the number of employees and the plan price
    const totalPlanPrice = totalEmployee * userPlan?.price;

    const handleCreateOrder = async (plan) => {
        // Check if an order is already in progress to prevent repeated calls
        if (loading || orderDetails) return;
        setLoading(true); // Start loading
        try {
            // If plan is not provided, fallback to userPlan
            const amount = plan?.amount || totalPlanPrice; // Use calculated totalPlanPrice or the plan amount
            const data = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/create-order/`, {
                body: { amount: amount * 100, currency: 'INR' } // Send the amount in paise
            });
            if (data && data.id) {
                setOrderDetails({
                    orderId: data.id,
                    currency: data.currency,
                    amount: data.amount,
                });
                setSelectedPlan(plan); // Trigger Razorpay popup by setting the selected plan
                setShowRazorpayPopup(true); // Show RazorpayPopUp
            }
        } catch (error) {
            console.error('Error creating order:', error);
        } finally {
            setLoading(false); // Stop loading after order is created
        }
    };

    const handlePaymentSuccess = async (response) => {
        setLoading(true); // Start loading
        try {
            const payload = {
                orderDetails: {
                    orderId: orderDetails.orderId,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                    amount: orderDetails.amount,
                    company_id: company._id,
                    employee_id: userInfo._id,
                    employee_limit: company.total_employees,
                    Buyuserlimit: company.total_employees,  // Include the Buyuserlimit field
                },
                status: 'done',  // Set status to done
            };

            // Send payment success data to the backend
            await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/api/handle_user_payment/`, {
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                }
            });

        } catch (err) {
            console.error('Error saving payment information:', err);
        } finally {
            // Reset order, selected plan, and popup visibility states
            setLoading(false); // Stop loading after payment is processed
            setOrderDetails(null);
            setSelectedPlan(null);
            setShowRazorpayPopup(false); // Hide RazorpayPopUp
            navigate('/allplans');
        }
    };

    const handlePaymentFailure = async (error) => {
        setLoading(true); // Start loading
        try {
            const payload = {
                orderDetails: {
                    orderId: orderDetails.orderId,
                    paymentId: error.razorpay_payment_id,
                    signature: error.razorpay_signature,
                    amount: orderDetails.amount,
                    company_id: company._id,
                    employee_id: userInfo._id,
                    employee_limit: company.total_employees,
                    Buyuserlimit: company.total_employees,  // Include the Buyuserlimit field
                },
                status: 'cancelled',  // Set status to cancelled
            };

            // Send payment failure data to the backend
            await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/api/handle_user_payment/`, {
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                }
            });

        } catch (err) {
            console.error('Error saving payment information:', err);
        } finally {
            // Reset order, selected plan, and popup visibility states
            setLoading(false); // Stop loading after handling payment failure
            setOrderDetails(null);
            setSelectedPlan(null);
            setShowRazorpayPopup(false); // Hide RazorpayPopUp
            navigate('/allplans');
        }
    };

    return (
        <div>
            <div className="space-y-5">
                {
                    loading ? <Grid count='3' /> : (
                        <Card title='Your Current Plan'>
                            <div className="grid xl:grid-cols-2 md:grid-cols-2 grid-cols-1 gap-5">
                                <div
                                    className={`bg-warning-500 price-table bg-opacity-[0.16] dark:bg-opacity-[0.36] rounded-[6px] p-6 text-slate-900 dark:text-white relative overflow-hidden z-[1]`}
                                >
                                    <div className="overlay absolute right-0 top-0 w-full h-full z-[-1]">
                                        <img src={img1} alt="" className="ml-auto block" />
                                    </div>
                                    <header className="mb-6">
                                        <h4 className="text-xl mb-5">{userPlan?.title || 'No Plan Available'}</h4>
                                        <div className="space-x-4 relative flex items-center mb-5 rtl:space-x-reverse">
                                            {`Price Rs ${userPlan?.price || 'N/A'} per user/month`}
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-300 text-sm">
                                            {`Total ${company?.total_employees || 0} Users Are Available In Your Company`}
                                        </p>
                                        <div className="space-x-4 relative flex items-center mb-5 rtl:space-x-reverse">
                                            {`${totalPlanPrice || 0}`}  {/* Display calculated total price */}
                                        </div>
                                    </header>
                                    <div className="price-body space-y-8">
                                        <p className="text-sm leading-5 text-slate-600 dark:text-slate-300">
                                            {latestPayment ? `Last Payment: Rs ${latestPayment.amount} on ${new Date(latestPayment.created_at).toLocaleDateString()} | Expiry Date: ${expiryDate}` : (userPlan?.description || 'No Description Available')}
                                        </p>
                                        <div>
                                            <Button
                                                text='Renew Plan'
                                                className="btn-outline-dark dark:border-slate-400 w-full"
                                                onClick={() => handleCreateOrder(userPlan)} // Pass userPlan instead of latestPayment
                                                isLoading={loading || orderDetails} // Disable button if loading or an order is already in progress
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <ProgressBar
                                        value={percentage}
                                        title={`${totalEmployee} Total Users / ${employeeLimit} Total Limit`}
                                        backClass="h-[14px] rounded-[999px]"
                                        className="bg-danger-500"
                                    />
                                </div>
                            </div>
                        </Card>
                    )
                }
            </div>

            
            {orderDetails && selectedPlan && showRazorpayPopup && ( // Check showRazorpayPopup state
                <RazorpayPopUp
                    orderId={orderDetails.orderId} 
                    amount={orderDetails.amount}
                    currency={orderDetails.currency}
                    keyId={import.meta.env.VITE_RAZORPAY_KEY_ID}
                    keySecret={import.meta.env.VITE_APP_RAZORPAY_KEY_SECRET}
                    company={company}
                    numEmployees={company.total_employees}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentFailure={handlePaymentFailure}
                    closePopup={() => {
                        setOrderDetails(null);
                        setSelectedPlan(null);
                        setShowRazorpayPopup(false); // Hide RazorpayPopUp
                    }}
                />
            )}
        </div>
    );
}