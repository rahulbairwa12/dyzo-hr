import Card from "@/components/ui/Card";
import { Tab } from "@headlessui/react";
import React, { Fragment, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import ContactModal from "./rootpage/ContactModal";
import ExtensionTermAndCondition from "./ExtensionTermAndCondition";
// import Header from "./rootpage/Header";
// import Footer from "./rootpage/Footer";
import Header from "./homePage/Header";
import Footer from "./homePage/Footer";

const buttons = [
  {
    title: "Introduction",
    icon: "heroicons-outline:document",
  },
  {
    title: "Services Provided",
    icon: "heroicons-outline:document",
  },
  {
    title: "Account Registration",
    icon: "heroicons-outline:document",
  },
  {
    title: "Termination of Accounts",
    icon: "heroicons-outline:document",
  },
  {
    title: "Changes to Services and Terms",
    icon: "heroicons-outline:document",
  },
  {
    title: "Data Accuracy and Use",
    icon: "heroicons-outline:document",
  },
  {
    title: "Data Backup and Responsibility",
    icon: "heroicons-outline:document",
  },
  {
    title: "User Conduct",
    icon: "heroicons-outline:document",
  },
  {
    title: "Limitation of Liability",
    icon: "heroicons-outline:document",
  },
  {
    title: "Indemnification",
    icon: "heroicons-outline:document",
  },
  {
    title: "Governing Law",
    icon: "heroicons-outline:document",
  },
  {
    title: "Contact Information",
    icon: "heroicons-outline:document",
  },
];

const TermAndCondition = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <Helmet>
        <title>Terms and Conditions | Dyzo</title>
        <meta name="description" content="Read Dyzo's terms and conditions for using our task management and time tracking platform." />
        <meta property="og:title" content="Terms and Conditions | Dyzo" />
        <meta property="og:url" content="https://dyzo.ai/terms-and-conditions" />
        <link rel="canonical" href="https://dyzo.ai/terms-and-conditions" />
      </Helmet>
      <Header />

      <div className="bg-gray-100">
        <div className="max-w-[1300px] mx-auto px-4 py-8">
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
                <div className="lg:col-span-9 md:col-span-7 col-span-12">
                  <Tab.Panels>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <p className="text-blue-600 italic pb-2">
                          Last updated: 31st July 2024
                        </p>
                        <h3 className="font-semibold mb-4">Terms of Service</h3>
                        <p>
                          Welcome to Dyzo. These Terms of Service ("Terms") govern
                          your use of our website and services. By accessing or
                          using Dyzo, you agree to comply with and be bound by
                          these Terms.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">Services Provided</h3>
                        <p>
                          Dyzo provides a platform for data analysis and business
                          insights. We offer a 14-day free trial for new users,
                          followed by a money-back guarantee for the first two
                          months of usage. No refunds will be given after this
                          period.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">
                          Account Registration
                        </h3>
                        <p>
                          To use our services, you may need to create an account.
                          You agree to provide accurate and complete information
                          during the registration process and to keep your account
                          information up to date.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">
                          Termination of Accounts
                        </h3>
                        <p>
                          Dyzo reserves the right to terminate any account or
                          company at our sole discretion, without prior notice, if
                          we believe you are in breach of these Terms or engaged
                          in activities that may harm Dyzo or its users.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">
                          Changes to Services and Terms
                        </h3>
                        <p>
                          We reserve the right to modify or discontinue our
                          services at any time without notice. Additionally, we
                          may change these Terms at any time. The most current
                          version of the Terms will be posted on our website. By
                          continuing to use our services after changes are made,
                          you agree to be bound by the revised Terms.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className=" font-semibold mb-4">
                          Data Accuracy and Use
                        </h3>
                        <p>
                          Dyzo is a tool designed to provide accurate data and
                          insights. However, we do not offer any guarantee on data
                          accuracy. Users are responsible for verifying the
                          accuracy of any data obtained through our services.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className=" font-semibold mb-4">
                          Data Backup and Responsibility
                        </h3>
                        <p>
                          We do not provide backup services. In the event of data
                          loss, it is the responsibility of the user to manage and
                          safeguard their data. Dyzo and its parent company are
                          not liable for any data loss.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">User Conduct</h3>
                        <p>
                          You agree to use Dyzo in compliance with all applicable
                          laws and regulations. You are prohibited from using our
                          services for any unlawful purpose or in a manner that
                          could damage, disable, or impair our services or
                          interfere with any other party's use of our services.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">
                          Limitation of Liability
                        </h3>
                        <p>
                          To the maximum extent permitted by law, Dyzo and its
                          affiliates, officers, directors, employees, agents, and
                          licensors shall not be liable for any indirect,
                          incidental, special, consequential, or punitive damages,
                          or any loss of profits or revenues, whether incurred
                          directly or indirectly, or any loss of data, use,
                          goodwill, or other intangible losses, resulting from
                          your use of our services.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">Indemnification</h3>
                        <p>
                          You agree to indemnify and hold harmless Dyzo, its
                          affiliates, officers, directors, employees, agents, and
                          licensors from any claims, liabilities, damages, losses,
                          and expenses, including without limitation reasonable
                          legal and accounting fees, arising out of or in any way
                          connected with your access to or use of our services, or
                          your violation of these Terms.
                        </p>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">Governing Law</h3>
                        <p>
                          These Terms shall be governed by and construed in
                          accordance with the laws of Rajasthan, without regard to
                          its conflict of law principles. Any legal action or
                          proceeding arising under these Terms will be brought
                          exclusively in the federal or state courts located in
                          Rajasthan, and the parties irrevocably consent to the
                          personal jurisdiction and venue therein.
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
                          305624 India
                        </address>
                      </div>
                    </Tab.Panel>
                  </Tab.Panels>
                </div>
              </div>
            </Tab.Group>
          </Card>
          <div className="text-center mt-8">
            <span
              className="bg-blue-600 text-white p-2 border rounded-lg border-blue-600 cursor-pointer hover:bg-white hover:text-black-500"
              onClick={() => navigate("/extension-terms-and-conditions")}
            >
              extension terms and conditions
            </span>
          </div>
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

export default TermAndCondition;
