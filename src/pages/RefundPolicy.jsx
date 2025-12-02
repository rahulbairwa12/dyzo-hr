import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Card from "@/components/ui/Card";
// import Header from "./rootpage/Header";
// import Footer from "./rootpage/Footer";
import Header from "./homePage/Header";
import Footer from "./homePage/Footer";

const RefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Refund Policy | Dyzo</title>
        <meta name="description" content="Read Dyzo's refund policy for monthly and annual plans, and how to request refunds." />
        <meta property="og:title" content="Refund Policy | Dyzo" />
        <meta property="og:url" content="https://dyzo.ai/refund-policy" />
      </Helmet>
      <Header />

      <div className="bg-gray-100">
        <div className="flex-grow max-w-[1300px] mx-auto px-4 py-8">
          <Card className="p-6 md:p-8">
            <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              <h1 className="text-2xl font-bold mb-6 text-primary-500">
                DYZO Refund Policy
              </h1>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">
                  1. Monthly Plans – No Refunds
                </h2>
                <p className="mb-4">
                  DYZO follows a no-refund policy for monthly subscriptions. Once
                  a payment is made, it cannot be refunded.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>You won’t be charged for the next billing cycle</li>
                  <li>
                    You’ll retain access to DYZO until your current billing period
                    ends
                  </li>
                  <li>
                    No refund will be issued for unused days in the current month
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">
                  2. Annual Plans – Partial Refunds Possible
                </h2>
                <p className="mb-4">
                  If you're subscribed to an annual plan and decide to cancel
                  early:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    You may be eligible for a refund for the remaining full months
                  </li>
                  <li>
                    To request a refund, email us at{" "}
                    <a
                      href="mailto:support@dyzo.ai"
                      className="text-blue-500 hover:underline"
                    >
                      support@dyzo.ai
                    </a>
                  </li>
                  <li>
                    The DYZO team will review your request and process eligible
                    refunds within 2–3 weeks
                  </li>
                  <li>Only unused full months will be considered for refunds</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">
                  3. Refund Requests Due to Technical or Functional Issues
                </h2>
                <p className="mb-4">If you feel that:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    You were unable to use DYZO due to a technical issue, or
                  </li>
                  <li>
                    You were not satisfied with the features or functionality
                  </li>
                </ul>
                <p className="mt-3 mb-2">
                  You may request a refund by contacting{" "}
                  <a
                    href="mailto:support@dyzo.ai"
                    className="text-blue-500 hover:underline"
                  >
                    support@dyzo.ai
                  </a>
                  . The DYZO team will review your case individually.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>You’ll receive a response within 2–3 weeks</li>
                  <li>
                    Refunds in such situations are not guaranteed and depend on
                    the nature of the issue
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">
                  4. Refunds for Failed or Duplicate Charges
                </h2>
                <p className="mb-4">
                  In case of billing errors like duplicate payments or failed
                  transactions:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    Contact us at{" "}
                    <a
                      href="mailto:support@dyzo.ai"
                      className="text-blue-500 hover:underline"
                    >
                      support@dyzo.ai
                    </a>{" "}
                    within 7 days of the transaction
                  </li>
                  <li>
                    Share relevant payment details (transaction ID, amount, date)
                  </li>
                  <li>
                    Valid cases will be refunded to the original payment method
                    within 2–3 weeks
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">
                  5. Subscription Cancellation
                </h2>
                <p className="mb-3">
                  You can cancel your subscription anytime through your DYZO
                  account or by contacting support.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    Your account remains active until the end of the current
                    billing cycle
                  </li>
                  <li>No charges will occur in future cycles</li>
                  <li>
                    No partial or prorated refunds will be issued for the ongoing
                    billing period
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">6. Policy Updates</h2>
                <p className="mb-4">
                  DYZO may update this refund policy at any time. Changes will be
                  posted here and will become effective immediately upon posting.
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
                <p>
                  For any billing or refund-related queries, feel free to contact
                  us at:{" "}
                  <a
                    href="mailto:support@dyzo.ai"
                    className="text-blue-500 hover:underline"
                  >
                    📧 support@dyzo.ai
                  </a>
                </p>
              </div>

              <p className="text-blue-600 italic">Last Updated: April 16, 2025</p>
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
