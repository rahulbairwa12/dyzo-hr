import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/Textinput";
import img1 from "@/assets/images/all-img/big-shap1.png";
import img2 from "@/assets/images/all-img/big-shap2.png";
import img3 from "@/assets/images/all-img/big-shap3.png";
import img4 from "@/assets/images/all-img/big-shap4.png";
import RazorpayPop from "./dispalyrazorpay"; // Import RazorpayPopUp component
import { fetchPOST } from '@/store/api/apiSlice';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { djangoBaseURL } from "@/helper";
import { useSelector } from "react-redux"; 

const UserPricingPage = ({ plans, company }) => {
  const [check, setCheck] = useState(false);
  const [numEmployees, setNumEmployees] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false); // Add loading state
  const userInfo = useSelector((state) => state.auth.user);

  const toggle = () => {
    setCheck(!check);
  };

  const FormValidationSchema = yup
    .object({
      username: yup.string().required(),
      number: yup.number().required().positive(),
      betweenNumber: yup
        .number()
        .required("The Number between field is required")
        .positive()
        .min(1)
        .max(10),
      alphabetic: yup
        .string()
        .required()
        .matches(/^[a-zA-Z]+$/, "Must only consist of alphabetic characters"),
      length: yup.string().required("The Min Character field is required").min(3),
      password: yup.string().required().min(8),
      url: yup.string().required("The URL field is required").url(),
      message: yup.string().required("The Message field is required"),
    })
    .required();

  const { register, formState: { errors }, handleSubmit } = useForm({
    resolver: yupResolver(FormValidationSchema),
  });

  const handleEmployeeChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setNumEmployees(value);
    } else {
      setNumEmployees(1);
    }
  };

  const handleCreateOrder = async (plan) => {
    setLoading(true); // Start loading
    try {
      const amount = plan.price_Monthly;
      const data = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/create-order/`, {
        body: { amount: amount*100 , currency: 'INR' }
      });
      if (data && data.id) {
        setOrderDetails({
          orderId: data.id,
          currency: data.currency,
          amount: data.amount,
        });
        setSelectedPlan(plan); // Trigger Razorpay popup by setting the selected plan
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
          employee_limit: numEmployees,
          Buyuserlimit: numEmployees,  // Include the Buyuserlimit field
        }
      };
  
      // Send payment success data to the backend
      await fetchPOST(`${djangoBaseURL}/api/handle_user_payment/`, {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
    } catch (err) {
      console.error('Error saving payment information:', err);
    } finally {
      setLoading(false); // Stop loading after payment is processed
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
          employee_limit: numEmployees,
          Buyuserlimit: numEmployees,  // Include the Buyuserlimit field
        }
      };
  
      // Send payment failure data to the backend
      await fetchPOST(`${djangoBaseURL}/api/handle_user_payment/`, {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
    } catch (err) {
      console.error('Error saving payment information:', err);
    } finally {
      setLoading(false); // Stop loading after handling payment failure
    }
  };

  const tables = plans.map((plan, index) => ({
    title: plan.title,
    price_Yearly: `${(parseFloat(plan.price) * 12 * numEmployees).toFixed(2)}`,
    price_Monthly: `${(parseFloat(plan.price) * numEmployees).toFixed(2)}`,
    description: plan.description,
    bg: ["bg-warning-500", "bg-info-500", "bg-success-500", "bg-primary-500"][index % 4],
    img: [img1, img2, img3, img4][index % 4],
  }));

  return (
    <div>
      <div className="space-y-5">
        <Card>
          <div className="flex justify-between mb-6">
            <h4 className="text-slate-900 text-xl font-medium">Plans</h4>
            <label className="inline-flex text-sm cursor-pointer">
              <input type="checkbox" onChange={toggle} hidden />
              <span
                className={`
                  ${!check
                    ? "bg-slate-900 dark:bg-slate-900 text-white"
                    : " dark:text-slate-300"
                  }
                  px-[18px] py-1 transition duration-100 rounded
                `}
              >
                Monthly
              </span>
              <span
                className={` ${check
                  ? "bg-slate-900 dark:bg-slate-900 text-white"
                  : "dark:text-slate-300"
                } 
                  px-[18px] py-1 transition duration-100 rounded`}
              >
                Yearly
              </span>
            </label>
          </div>
          <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-5">
            {tables.map((item, i) => (
              <div
                className={`${item.bg}
                  price-table bg-opacity-[0.16] dark:bg-opacity-[0.36] rounded-[6px] p-6 text-slate-900 dark:text-white relative overflow-hidden z-[1]
                `}
                key={i}
              >
                <div className="overlay absolute right-0 top-0 w-full h-full z-[-1]">
                  <img src={item.img} alt="" className="ml-auto block" />
                </div>
                <header className="mb-6">
                  <h4 className="text-xl mb-5">{item.title}</h4>
                  <div className="space-x-4 relative flex items-center mb-5 rtl:space-x-reverse">
                    {check ? (
                      <span className="text-[32px] leading-10 font-medium">
                        {item.price_Yearly}{" "}
                      </span>
                    ) : (
                      <span className="text-[32px] leading-10 font-medium">
                        {item.price_Monthly}
                      </span>
                    )}
                    <span className="text-xs text-warning-500 font-medium px-3 py-1 rounded-full inline-block bg-white uppercase h-auto">
                      Save 20%
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">
                    {`${item.price_Monthly} per user/month, annually`}
                    {`Total Employees: ${company?.total_employees} / Employee Limit: ${company?.employee_limit}`}
                  </p>
                  <TextInput
                    label="Number of Employees"
                    type="number"
                    placeholder="Enter Total Number Employees"
                    value={numEmployees}
                    onChange={handleEmployeeChange}
                    name="number"
                    register={register}
                  />
                </header>
                <div className="price-body space-y-8">
                  <p className="text-sm leading-5 text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>
                  <div>
                    <Button
                      text='Buy now'
                      className="btn-outline-dark dark:border-slate-400 w-full"
                      onClick={() => handleCreateOrder(item)} // Create order and trigger Razorpay popup
                      isLoading={loading} // Pass loading state to Button component
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {orderDetails && selectedPlan && (
        <RazorpayPop
          orderId={orderDetails.orderId}
          amount={orderDetails.amount}
          currency={orderDetails.currency}
          keyId={import.meta.env.VITE_RAZORPAY_KEY_ID}
          keySecret={import.meta.env.VITE_APP_RAZORPAY_KEY_SECRET}
          company={company}
          numEmployees={numEmployees}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          closePopup={() => setOrderDetails(null)}
        />
      )}
    </div>
  );
};

export default UserPricingPage;