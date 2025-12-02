import React, { useState } from 'react';
import Header from "./homePage/Header";
import Footer from "./homePage/Footer";
import { Helmet } from 'react-helmet-async';
 
const PricingCalculator = () => {
  const [userCount, setUserCount] = useState(1);
  const [isYearly, setIsYearly] = useState(false);
 
  const pricePerUser = 75;
  const totalPrice = userCount * pricePerUser;
  const displayPrice = isYearly ? totalPrice * 12 : totalPrice;
  const periodText = isYearly ? 'Per Year' : 'Per Month';
 
  const features = [
    { text: 'Unlimited Tasks', checked: true },
    { text: 'Unlimited projects', checked: true },
    { text: 'Inbox', checked: true },
    { text: 'Time sheet', checked: true },
    { text: 'Multiple assignee', checked: true },
    { text: 'AI assistant', checked: true },
    { text: 'Time tracking', checked: true },
    { text: 'Smart notifications', checked: true },
    { text: 'Dashboard reports', checked: true },
    { text: 'Custom task statuses', checked: true },
    { text: 'Custom Sprint', checked: true },
    { text: 'Desktop and mobile app', checked: true }
  ];
 
  return (
    <div className="max-w-6xl mx-auto bg-white/70 p-4 md:p-12 rounded-lg border border-electricBlue-100">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Calculator */}
        <div className="space-y-6">
          {/* Price per user input */}
          <div>
            <input
              type="text"
              value={`${pricePerUser}/- Rs. per user`}
              readOnly
              className="w-full px-4 py-2 border focus:outline-none border-neutral-50 rounded-md text-base font-medium bg-transparent"
            />
          </div>
 
          {/* Number of users */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">No. of User's</label>
            <div className="relative">
              <input
                type="text"
                value={userCount}
                onChange={(e) => setUserCount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border focus:outline-electricBlue-100 border-neutral-50 rounded-md text-base font-medium bg-transparent"
              />
            </div>
          </div>
        </div>
 
        {/* Right side - Total Payment */}
        <div className="bg-white rounded-md border-2 border-neutral-50 p-4">
          <div className="">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-gray-700">Total Payment</span>
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${!isYearly ? 'text-electricBlue-100 font-medium' : 'text-gray-500'}`}>Monthly</span>
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isYearly ? 'bg-electricBlue-100' : 'bg-gray-300'
                    }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isYearly ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
                <span className={`text-sm ${isYearly ? 'text-electricBlue-100 font-medium' : 'text-gray-500'}`}>Yearly</span>
              </div>
            </div>
 
            <div className="text-4xl font-bold text-electricBlue-100 mb-2">
              {displayPrice}/-
              <span className="text-lg font-normal ml-2">{periodText}</span>
            </div>
            <div className="text-sm text-gray-500">
              {pricePerUser}/- Rs. per user
            </div>
          </div>
        </div>
      </div>
 
      {/* Features Grid */}
      <div className="mt-8 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <span className="text-gray-700 font-medium text-sm">{feature.text}</span>
          </div>
        ))}
      </div>
 
      {/* Get Started Button */}
      <div className="mt-16 text-center">
        <a
          href="/register"
          className="px-5 py-2 rounded-xl bg-blue-600 text-white text-base font-medium shadow hover:bg-blue-700 transition inline-block"
        >
          Get Started Now
        </a>
      </div>
    </div>
  );
};
 
const Pricing = () => {
  return (
    <div className='bg-gray-100'>
      <Helmet>
        <title>Pricing | Dyzo</title>
        <meta
          name="description"
          content="Explore Dyzo’s flexible pricing plans for task, HR, and time tracking automation. Choose monthly or yearly subscriptions and scale as your team grows."
        />
        <meta property="og:title" content="Pricing | Dyzo" />
        <meta property="og:url" content="https://dyzo.ai/pricing" />
        <link rel="canonical" href="https://dyzo.ai/pricing" />
      </Helmet>
      <Header />
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:pt-16 border-b md:border-b-0">
        <PricingCalculator />
      </div>
      <Footer />
    </div>
  )
}
 
export default Pricing