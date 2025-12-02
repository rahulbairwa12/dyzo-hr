import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { fetchAuthGET, fetchPOST } from '@/store/api/apiSlice';
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import img1 from "@/assets/images/all-img/big-shap1.png";
import ProgressBar from "@/components/ui/ProgressBar";
import Grid from '@/components/skeleton/Grid';
import RazorpayPopUp from '../utility/RazorpayPopUp'; // Assuming you have this component
import dayjs from 'dayjs';
import { formatDateWithTime } from '@/helper/helper';

export default function Storage() {
    const [storage, setStorage] = useState({});
    const [latestPayment, setLatestPayment] = useState({});
    const [loading, setLoading] = useState(false);
    const [displayRazorpay, setDisplayRazorpay] = useState(false);
    const [orderDetails, setOrderDetails] = useState({ orderId: null, currency: null, amount: null });
    const [paymentStatus, setPaymentStatus] = useState(null); // To track payment status
    const userInfo = useSelector((state) => state.auth.user);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/company/${userInfo?.companyId}/storage/`);
                if (response) {
                    setStorage(response.data); // Set the storage data
                    setLatestPayment(response.latest_payment); // Set the latest payment data
                }
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userInfo?.companyId]);

    const percentage = ((storage?.used_storage_mb / storage?.storage_plan?.size_mb) * 100).toFixed(2);
    const storageSizeGB = (storage?.storage_plan?.size_mb / 1024).toFixed(2);
    const usedStorageGB = (storage?.used_storage_mb / 1024).toFixed(2);

    // Calculate the expiry date based on the payment plan and created_at date
    const expiryDate = dayjs(latestPayment?.created_at)
        .add(latestPayment?.payment_plan === 'monthly' ? 1 : 12, 'month')
        .format('YYYY-MM-DD');

    const handleCreateOrder = async () => {
        const amount = parseFloat(latestPayment?.amount).toFixed(2);

        try {
            const data = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/create-order/`, { body: { amount: amount * 100, currency: "INR" } });
            if (data && data.id) {
                setOrderDetails({
                    orderId: data.id,
                    currency: data.currency,
                    amount: data.amount,
                });
                setPaymentStatus('in progress'); // Set initial payment status
                setDisplayRazorpay(true);
            }
        } catch (error) {
            console.error("Error creating order:", error);
        }
    };

    const closeRazorpayPopup = () => {
        setDisplayRazorpay(false);
    };

    return (
        <div>
            <div className="space-y-5">
                {
                    loading ? <Grid count='3' /> : (
                        <Card title='Active Plan'>
                            <div className="grid xl:grid-cols-2 md:grid-cols-2 grid-cols-1 gap-5">
                            {latestPayment && userInfo?.isAdmin && (
                                    <div
                                        className={`bg-warning-500 price-table bg-opacity-[0.16] dark:bg-opacity-[0.36] rounded-[6px] p-6 text-slate-900 dark:text-white relative overflow-hidden z-[1]`}
                                    >
                                        <div className="overlay absolute right-0 top-0 w-full h-full z-[-1]">
                                            <img src={img1} alt="" className="ml-auto block" />
                                        </div>
                                        <header className="mb-6">
                                            <h4 className="text-xl mb-5">{storage?.storage_plan?.title}</h4>
                                            <div className="space-x-4 relative flex items-center mb-5 rtl:space-x-reverse">
                                                {`Price Rs ${storage?.storage_plan?.price}/GB/Month`}
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-300 text-sm">
                                                {`Storage ${storageSizeGB} GB`}
                                            </p>
                                            <p className="text-slate-500 dark:text-slate-300 text-sm">
                                                {`Payment Plan: ${latestPayment?.payment_plan}`}
                                            </p>
                                            <p className="text-slate-500 dark:text-slate-300 text-sm">
                                                {`Start Date: ${formatDateWithTime(latestPayment?.created_at)}`}
                                            </p>
                                            <p className="text-red-500 dark:text-red-500 text-sm">
                                                {`Expiry Date: ${formatDateWithTime(expiryDate)}`}
                                            </p>
                                            <p className="text-slate-500 dark:text-slate-300 text-sm">
                                                {`Razorpay Order ID: ${latestPayment?.razorpay_order_id}`}
                                            </p>
                                        </header>
                                        <div className="price-body space-y-8">
                                            <p className="text-sm leading-5 text-slate-600 dark:text-slate-300">
                                                {storage?.storage_plan?.description}
                                            </p>
                                            <div>
                                                <Button
                                                    text='Renew Plan'
                                                    className="btn-outline-dark dark:border-slate-400 w-full"
                                                    onClick={handleCreateOrder}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <ProgressBar
                                        value={percentage}
                                        title={`Storage used ${usedStorageGB} / ${storageSizeGB} GB`}
                                        backClass="h-[14px] rounded-[999px]"
                                        className="bg-danger-500"
                                    />
                                </div>
                            </div>
                        </Card>
                    )
                }

                {displayRazorpay && (
                    <RazorpayPopUp
                        amount={orderDetails.amount}
                        currency={orderDetails.currency}
                        orderId={orderDetails.orderId}
                        keyId={import.meta.env.VITE_RAZORPAY_KEY_ID}
                        keySecret={import.meta.env.VITE_APP_RAZORPAY_KEY_SECRET}
                        closePopup={closeRazorpayPopup}
                        paymentPlan={latestPayment?.payment_plan}
                        sizeByInMb={storage?.storage_plan?.size_mb}
                        setPaymentStatus={setPaymentStatus} // Pass status handler
                    />
                )}
            </div>
        </div>
    );
}