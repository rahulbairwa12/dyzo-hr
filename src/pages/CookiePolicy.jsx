import Card from "@/components/ui/Card";
import { Tab } from "@headlessui/react";
import React, { Fragment, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Footer from "./rootpage/Footer";
import ContactModal from "./rootpage/ContactModal";
import Header from "./rootpage/Header";

const buttons = [
  { title: "Introduction", icon: "heroicons-outline:home" },
  { title: "What Are Cookies?", icon: "heroicons-outline:user" },
  { title: "Types of Cookies We Use", icon: "heroicons-outline:chat-alt-2" },
  { title: "How We Use Cookies", icon: "heroicons-outline:cog" },
  { title: "Third-Party Cookies", icon: "heroicons-outline:cog" },
  {
    title: "Managing Your Cookie Preferences",
    icon: "heroicons-outline:lock-closed",
  },
  { title: "Changes to This Policy", icon: "heroicons-outline:refresh" },
  { title: "Contact Us", icon: "heroicons-outline:phone" },
];

const CookiePolicy = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <Header/>
        <Helmet>
          <title>Cookie Policy | Dyzo</title>
          <meta name="description" content="Understand how Dyzo uses cookies and how you can manage your preferences." />
          <meta property="og:title" content="Cookie Policy | Dyzo" />
          <meta property="og:url" content="https://dyzo.ai/cookie-policy" />
        </Helmet>

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
                                                    ${selected
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
                      <p className="text-blue-600 italic pb-2">
                        Last updated: 31st July 2024
                      </p>
                      <h3 className="font-semibold mb-4">Cookie Policy</h3>
                      <p>
                        Dyzo ("we," "us," "our") uses cookies and similar
                        technologies to enhance your experience on our website
                        and to provide you with personalized content and
                        advertisements. This Cookie Policy explains what cookies
                        are, how we use them, and how you can manage your cookie
                        preferences.
                      </p>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <h3 className="font-semibold mb-4">What Are Cookies?</h3>
                      <p>
                        Cookies are small text files that are stored on your
                        device (computer, tablet, or mobile) when you visit a
                        website. They are widely used to make websites work,
                        improve user experience, and provide information to
                        website owners.
                      </p>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <h3 className="font-semibold mb-4">
                        Types of Cookies We Use
                      </h3>
                      <ul className="list-disc list-inside">
                        <li>
                          <strong>Essential Cookies:</strong> Necessary for the
                          website to function correctly, enabling basic features
                          such as page navigation and access to secure areas.
                        </li>
                        <li>
                          <strong>Performance Cookies:</strong> Collect
                          information about how visitors use the website to
                          improve performance.
                        </li>
                        <li>
                          <strong>Functional Cookies:</strong> Allow the website
                          to remember choices you make (e.g., username,
                          language) and provide enhanced features.
                        </li>
                        <li>
                          <strong>Targeting/Advertising Cookies:</strong> Used
                          to deliver advertisements relevant to your interests
                          and measure the effectiveness of campaigns.
                        </li>
                      </ul>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <h3 className="font-semibold mb-4">How We Use Cookies</h3>
                      <p>
                        We use cookies to enhance user experience, analyze
                        website usage, personalize content, and display targeted
                        advertisements.
                      </p>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <h3 className="font-semibold mb-4">
                        Third-Party Cookies
                      </h3>
                      <p>
                        We may also use third-party cookies from service
                        providers, such as analytics and advertising partners,
                        to help us achieve the purposes mentioned above.
                      </p>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <h3 className="font-semibold mb-4">
                        Managing Your Cookie Preferences
                      </h3>
                      <p>
                        You can manage your cookie preferences through your
                        browser settings. Most browsers allow you to view,
                        delete, block, and set preferences for cookies.
                        Disabling cookies may affect the functionality and
                        performance of our website.
                      </p>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <h3 className="font-semibold mb-4">
                        Changes to This Cookie Policy
                      </h3>
                      <p>
                        We may update this Cookie Policy from time to time to
                        reflect changes in our practices or for legal reasons.
                        We encourage you to review this Cookie Policy
                        periodically for any changes.
                      </p>
                    </Tab.Panel>
                    <Tab.Panel className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        <h3 className="font-semibold mb-4">Contact Us</h3>
                        <p>If you have any questions or concerns, please contact us at:</p>
                        <address className="mt-2">
                          Dyzo<br />
                          Email: <a href="mailto: team@prpwebs.com" className="text-blue-500">team@prpwebs.com </a><br />
                          Phone: <a href="tel:+919166728199" className="text-blue-500">+91 91667 28199</a><br />
                          Address: PRP Webs, New Munim Colony<br />
                          Bijainagar, Rajasthan<br />
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

      <ContactModal showContactModal={isModalOpen} setShowContactModal={setIsModalOpen} />

    </div>
  );
};

export default CookiePolicy;
