import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/store/api/apiSlice';
import Header from './Header';
import Footer from '../rootpage/Footer';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const PlanPage = () => {
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [billingCycle, setBillingCycle] = useState('yearly');

    const PlanLink = [
        {
            id: 1,
            plan_name: 'Basic',
            buttonLinkMonthly: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-9M361746EW475441EM6IOU2Q',
            buttonLinkYearly: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-1SK84373JV261171TM6IOVSQ',
        },
        {
            id: 2,
            plan_name: 'Pro',
            buttonLinkMonthly: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-2M111223EW475441EM6IOU2Q',
            buttonLinkYearly: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-2SK84373JV261171TM6IOVSQ',
        },
        {
            id: 3,
            plan_name: 'Advanced',
            buttonLinkMonthly: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-3M361746EW475441EM6IOU2Q',
            buttonLinkYearly: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-3SK84373JV261171TM6IOVSQ',
        },
    ];

    const fetchSubscriptionPlans = async () => {
        try {
            const response = await fetchAPI('api/subscription-plans/');
            if (response.status) {
                const paidPlans = response.data.filter((plan) => plan.isPaid);
                // Merge the PlanLink data with the fetched subscriptionPlans data
                const mergedPlans = paidPlans.map((plan) => {
                    const link = PlanLink.find((link) => link.plan_name === plan.plan_name);
                    return { ...plan, ...link }; // Merge link data with plan data
                });
                setSubscriptionPlans(mergedPlans);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchSubscriptionPlans();
    }, []);

    const handleBillingCycleChange = (event) => {
        setBillingCycle(event.target.value);
    };

    return (
        <>
            <Header />
            <div className="container py-6 relative">
                {/* Dropdown */}
                <div className="absolute top-6 right-6">
                    <select
                        value={billingCycle}
                        onChange={handleBillingCycleChange}
                        className="border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="yearly">Yearly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <h1 className="text-center text-[48px] leading-[56px] font-light">Choose your plan</h1>
                <p className="text-center text-[#6d6e6f] text-[24px] leading-[32px]">
                    Stay swift, efficient, and effortlessly productive with Dyzo.
                </p>
                <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 lg:gap-6 xl:gap-4 mt-20">
                        {subscriptionPlans.map((plan) => (
                            <div key={plan.id} className="relative flex flex-col">
                                {plan.plan_name === 'Pro' && (
                                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm shadow-lg">
                                        Recommended
                                    </div>
                                )}
                                <div className="border rounded-lg p-6 shadow-md hover:shadow-lg transition duration-300 text-center py-10 flex flex-col justify-between h-full">
                                    <h2 className="text-[24px] font-semibold">{plan.plan_name}</h2>
                                    <div className="pt-4">
                                        <p className="text-[#6d6e6f] font-light">{plan.description}</p>
                                    </div>
                                    <div className="mt-4">
                                        <ul className="font-light">
                                            <li className="flex items-center gap-2">
                                                <Icon icon="mdi:tick-circle-outline" width="14" height="14" />
                                                <p>
                                                    access of <span className="text-[18px] text-black">{plan.max_projects} projects</span>
                                                </p>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Icon icon="mdi:tick-circle-outline" width="14" height="14" />
                                                <p>
                                                    add up to <span className="text-[18px] text-black">{plan.max_employees} employees</span>
                                                </p>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Icon icon="mdi:tick-circle-outline" width="14" height="14" />
                                                <p>
                                                    screenshots storage <span className="text-[18px] text-black">{plan.storage} GB</span>
                                                </p>
                                            </li>
                                        </ul>
                                        <div className="flex justify-center items-center mt-4 gap-3">
                                            <div>
                                                <h4>
                                                    {billingCycle === 'yearly' ? `$${plan.annual_plan_price}` : `$${plan.monthly_plan_price}`}
                                                </h4>
                                                <p>/month</p>
                                            </div>
                                            {billingCycle === 'yearly' && (
                                                <div>
                                                    <p className="text-[#6d6e6f] text-[14px]">If billed annually</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-6 text-center">
                                        <a
                                            href={billingCycle === 'yearly' ? plan.buttonLinkYearly : plan.buttonLinkMonthly}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-600 inline-block"
                                        >
                                            Choose Plan
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Enterprise Card */}
                        <div className="relative flex flex-col">
                            <div className="border rounded-lg p-6 shadow-md hover:shadow-lg transition duration-300 text-center py-10 flex flex-col justify-between h-full">
                                <h2 className="text-[24px] font-semibold">Enterprise</h2>
                                <div className="mt-4">
                                    <p className="text-[#6d6e6f] font-light">
                                        Custom-built for large enterprises, this plan includes personalized solutions,
                                        dedicated support, and advanced tools to meet your unique business needs.
                                    </p>
                                </div>
                                <div className="mt-6 text-center">
                                    <Link to={'/contactus'} className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-600">
                                        Contact Us
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default PlanPage;
