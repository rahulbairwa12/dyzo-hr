import React, { Fragment } from 'react'
import Card from '@/components/ui/Card'
import { Tab } from '@headlessui/react'
// import Header from './rootpage/Header'
// import Footer from './rootpage/Footer'
import Header from "./homePage/Header";
import Footer from "./homePage/Footer";

const ExtensionTermAndCondition = () => {

  const buttons = [
    {
      title: "Information We Collect",
      icon: "heroicons-outline:document",
    },
    {
      title: "How We Use Your Data",
      icon: "heroicons-outline:document",
    },
    {
      title: "Data Sharing",
      icon: "heroicons-outline:document",
    },
    {
      title: "Data Storage and Retention",
      icon: "heroicons-outline:document",
    },
    {
      title: "Cookies and Tracking",
      icon: "heroicons-outline:document",
    },
    {
      title: "Security of Your Data",
      icon: "heroicons-outline:document",
    },
    {
      title: "Your Rights and Control",
      icon: "heroicons-outline:document",
    },
    {
      title: "Changes to This Privacy Policy",
      icon: "heroicons-outline:document",
    },
    {
      title: "Contact Us",
      icon: "heroicons-outline:document",
    }
  ];

  return (
    <>
      <Header />
      <div className="bg-gray-100">
        <div className="max-w-[1300px] mx-auto px-4 py-8">
          <h1 className='text-center text-3xl mb-8'>Privacy Policy for Dyzo Extension</h1>
          <Card>
            <Tab.Group>
              <div className="grid grid-cols-12 md:gap-4">
                <div className="lg:col-span-3 md:col-span-5 col-span-12">
                  <Tab.List>
                    {buttons.map((item, i) => (
                      <Tab key={i} as={Fragment}>
                        {({ selected }) => (
                          <button className={`text-sm font-medium md:block inline-block mb-4 last:mb-0 capitalize ring-0 focus:ring-0 focus:outline-none px-6 rounded-md py-2 transition duration-150 w-full
                                                  ${selected ? "text-white bg-primary-500 shadow-lg" : "text-slate-500 bg-white dark:bg-slate-700 dark:text-slate-300"}`}>
                            {item.title}
                          </button>
                        )}
                      </Tab>
                    ))}
                  </Tab.List>
                </div>
                <div className="lg:col-span-9 md:col-span-7 col-span-12">
                  <Tab.Panels>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <p className='text-blue-600 italic pb-2'>Effective Date: 3rd January 2025</p>
                        <p>Dyzo Extension ("we", "us", or "our") is a Chrome extension designed to integrate with our task management software, Dyzo.ai. This privacy policy explains how we collect, use, and protect data when you use the Dyzo Extension.</p>
                        <p>By using the Dyzo Extension, you agree to the collection and use of information in accordance with this policy.</p>

                        <h4 className="font-semibold my-4">Information We Collect</h4>
                        <p>When using the Dyzo Extension, we collect the following information:</p>
                        <ul class='list-disc pl-5'>
                          <li><span className='font-semibold'>URL of the current tab:</span> We collect the URL of the tab you're currently viewing when you use the extension to create a task.</li>
                          <li><span className='font-semibold'>Screenshots:</span> If you take a screenshot of your current tab or Chrome window using the extension, we store this screenshot to facilitate task creation.</li>
                        </ul>
                      </div>
                    </Tab.Panel>


                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h4 className="font-semibold my-4">How We Use Your Data</h4>
                        <p>The data we collect is used exclusively for the purpose of facilitating task creation in Dyzo.ai. This includes:</p>
                        <ul class='list-disc pl-5'>
                          <li>Storing the URL of the current tab to link your task with the relevant webpage.</li>
                          <li>Storing the screenshot you take for your task to serve as a visual reference in your Dyzo.ai task.</li>
                        </ul>

                        <p>This data is stored only for the purpose of syncing with your Dyzo.ai account and will be accessible only to you if you have the necessary login credentials.</p>
                      </div>
                    </Tab.Panel>


                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h4 className="font-semibold my-4">Data Sharing</h4>
                        <p>We do not share any data collected through the Dyzo Extension with third parties. Your data is only used for the task management features within Dyzo.ai.</p>
                      </div>
                    </Tab.Panel>


                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h4 className="font-semibold mb-4">Data Storage and Retention</h4>
                        <p>The screenshots and URLs collected by the extension are stored in your Dyzo.ai account and remain there according to the plan you're subscribed to. We do not store any other data locally within the extension. Your data will remain in your Dyzo.ai account unless deleted by you or subject to the terms and conditions of your Dyzo.ai plan.</p>
                      </div>
                    </Tab.Panel>


                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h4 className="font-semibold mb-4">Cookies and Tracking</h4>
                        <p>The Dyzo Extension does not use cookies or other tracking technologies. We do not track your activity outside of the task creation process.</p>
                      </div>
                    </Tab.Panel>


                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className=" font-semibold mb-4">Security of Your Data</h3>
                        <p>We take reasonable measures to protect the data you provide while using the Dyzo Extension. However, please note that no method of electronic transmission or storage is completely secure. While we strive to protect your data, we cannot guarantee its absolute security.</p>
                      </div>
                    </Tab.Panel>


                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h4 className=" font-semibold mb-4">Your Rights and Control</h4>
                        <p>As a user of Dyzo.ai, you have control over the screenshots and URLs you upload. You can delete your tasks, including any associated screenshots, from your Dyzo.ai account according to your account's settings.</p>
                        <p>If you wish to stop using the extension, you can simply uninstall it from your Chrome browser.</p>
                      </div>
                    </Tab.Panel>

                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h4 className="font-semibold mb-4">Changes to This Privacy Policy</h4>
                        <p>We may update this privacy policy from time to time. Any changes will be reflected on this page with an updated "Effective Date". We encourage you to review this policy periodically to stay informed about how we are protecting your data.</p>
                      </div>
                    </Tab.Panel>

                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h4 className="font-semibold mb-4">Contact Us</h4>
                        <p>If you have any questions about this privacy policy, please contact us at <span className='font-bold'>support@dyzo.ai.</span>
                        </p>
                      </div>
                    </Tab.Panel>
                  </Tab.Panels>
                </div>
              </div>
            </Tab.Group>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default ExtensionTermAndCondition