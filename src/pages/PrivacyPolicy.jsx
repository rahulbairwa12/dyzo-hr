import Card from "@/components/ui/Card";
import { Tab } from "@headlessui/react";
import React, { Fragment, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import ContactModal from "./rootpage/ContactModal";
// import Header from "./rootpage/Header";
// import Footer from "./rootpage/Footer";
import Header from "./homePage/Header";
import Footer from "./homePage/Footer";

const buttons = [
  { title: "Introduction", icon: "heroicons-outline:home" },
  { title: "Refund Policy", icon: "heroicons-outline:currency-dollar" },
  { title: "Information We Collect", icon: "heroicons-outline:user" },
  {
    title: "How We Use Your Information",
    icon: "heroicons-outline:chat-alt-2",
  },
  { title: "Your Rights and Choices", icon: "heroicons-outline:cog" },
  { title: "Sharing Your Information", icon: "heroicons-outline:cog" },
  { title: "Security Measures", icon: "heroicons-outline:lock-closed" },
  { title: "Children's Privacy", icon: "heroicons-outline:shield-exclamation" },
  { title: "Changes to This Policy", icon: "heroicons-outline:refresh" },
  { title: "Contact Us", icon: "heroicons-outline:phone" },
];

const PrivacyPolicy = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Privacy Policy | Dyzo</title>
        <meta name="description" content="Learn how Dyzo collects, uses, and protects your data. Read our privacy policy." />
        <meta property="og:title" content="Privacy Policy | Dyzo" />
        <meta property="og:url" content="https://dyzo.ai/privacy-policy" />
        <link rel="canonical" href="https://dyzo.ai/privacy-policy" />
      </Helmet>
      <Header />

      <div className="bg-gray-100">
        <div className="flex-grow max-w-[1300px] mx-auto px-4 py-8 w-full">
          <Card>
            <Tab.Group>
              <div className="grid grid-cols-12 md:gap-4">
                <div className="lg:col-span-3 md:col-span-5 col-span-12">
                  <Tab.List>
                    {buttons.map((item, i) => (
                      <Tab key={i} as={Fragment}>
                        {({ selected }) => (
                          <button
                            className={`text-sm font-medium md:block inline-block mb-4 last:mb-0 capitalize ring-0 focus:ring-0 focus:outline-none px-6 rounded-md py-2 transition duration-150 w-full 
                                                  ${
                                                    selected
                                                      ? "text-white bg-primary-500 shadow-lg"
                                                      : "text-slate-500 bg-white dark:bg-slate-700 dark:text-slate-300"
                                                  }`}
                          >
                            {item.title}
                          </button>
                        )}
                      </Tab>
                    ))}
                  </Tab.List>
                </div>

                <div className="lg:col-span-9 md:col-span-7 col-span-12 ">
                  <Tab.Panels>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md ">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <p className="text-blue-600 italic pb-2">
                          Last updated: 31st July 2024
                        </p>
                        <h3 className="font-semibold mb-4">Privacy Policy</h3>
                        <p>
                          Welcome to Dyzo. We are committed to protecting your
                          privacy and ensuring that your personal information is
                          handled in a safe and responsible manner. This Privacy
                          Policy outlines how we collect, use, and protect your
                          information when you use our services.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md ">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">Refund Policy</h3>
                        <p>
                          Dyzo offers a 30-Day money-back guarantee. If you make a
                          payment and your subscription has not started, you are
                          eligible for a full refund within 30 days. This policy
                          is designed to give you peace of mind when trying our
                          services.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">
                          Information We Collect
                        </h3>
                        <p>We may collect the following types of information:</p>
                        <ul className="list-disc list-inside mt-2">
                          <li>
                            <strong>Personal Information:</strong> Includes your
                            name, email address, phone number, and other contact
                            details.
                          </li>
                          <li>
                            <strong>Usage Data:</strong> Includes your IP address,
                            browser type, operating system, and other data.
                          </li>
                          <li>
                            <strong>Cookies and Tracking Technologies:</strong>{" "}
                            Used to collect and track information to improve and
                            analyze our service.
                          </li>
                        </ul>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">
                          How We Use Your Information
                        </h3>
                        <p>We use your information for the following purposes:</p>
                        <ul className="list-disc list-inside mt-2">
                          <li>
                            <strong>Providing Services:</strong> To deliver,
                            maintain, and improve our services.
                          </li>
                          <li>
                            <strong>Communication:</strong> To send you updates,
                            newsletters, and other information.
                          </li>
                          <li>
                            <strong>Analytics:</strong> To analyze website usage
                            and improve our services.
                          </li>
                          <li>
                            <strong>Security:</strong> To protect against fraud
                            and unauthorized access.
                          </li>
                        </ul>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">
                          Your Rights and Choices
                        </h3>
                        <p>
                          You have certain rights regarding your personal
                          information, including:
                        </p>
                        <ul className="list-disc list-inside mt-2">
                          <li>
                            <strong>Access and Correction:</strong> Request access
                            to your personal information.
                          </li>
                          <li>
                            <strong>Opt-Out:</strong> Opt out of receiving
                            marketing communications.
                          </li>
                          <li>
                            <strong>Data Deletion:</strong> Request the deletion
                            of your personal information.
                          </li>
                        </ul>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className=" font-semibold mb-4">
                          Sharing Your Information
                        </h3>
                        <p>
                          We may share your information with third parties under
                          certain circumstances:
                        </p>
                        <ul className="list-disc list-inside mt-2">
                          <li>
                            <strong>Service Providers:</strong> We share your
                            information with third-party vendors.
                          </li>
                          <li>
                            <strong>Legal Requirements:</strong> We may disclose
                            your information as required by law.
                          </li>
                          <li>
                            <strong>Business Transfers:</strong> Your information
                            may be transferred during business transactions.
                          </li>
                        </ul>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">Security Measures</h3>
                        <p>
                          We take reasonable measures to protect your information
                          from unauthorized access or disclosure. However, no data
                          transmission over the Internet can be guaranteed to be
                          100% secure.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">Children's Privacy</h3>
                        <p>
                          Our services are not intended for individuals under the
                          age of 13. We do not knowingly collect personal
                          information from children under 13.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">
                          Changes to This Privacy Policy
                        </h3>
                        <p>
                          We reserve the right to update this Privacy Policy at
                          any time. Changes to this Privacy Policy are effective
                          when posted on this page.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">Contact Us</h3>
                        <p>
                          If you have any questions or concerns, please contact us
                          at:
                        </p>
                        <address className="mt-2">
                          Dyzo
                          <br />
                          Email:{" "}
                          <a
                            href="mailto: support@dyzo.ai"
                            className="text-blue-500"
                          >
                            support@dyzo.ai
                          </a>
                          <br />
                          Phone:{" "}
                          <a href="tel:+919166728199" className="text-blue-500">
                            +91 91667 28199
                          </a>
                          <br />
                          Address: PRP Webs, New Munim Colony
                          <br />
                          Bijainagar, Rajasthan
                          <br />
                          305624, India
                        </address>
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

      <ContactModal
        showContactModal={isModalOpen}
        setShowContactModal={setIsModalOpen}
      />
    </div>
  );
};

export default PrivacyPolicy;
