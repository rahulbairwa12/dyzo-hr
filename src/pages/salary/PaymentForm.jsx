import React, { useEffect, useState } from "react";
import Select from "react-select";
import Textinput from "@/components/ui/Textinput";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import { fetchAuthPost } from "@/store/api/apiSlice";

const currency = [
  { value: "INR", label: "INR" },
  { value: "USD", label: "USD" },
];

const PaymentForm = ({
  employeeId,
  selectedYear,
  selectedMonth,
  showSalaryModal,
  setShowSalaryModal,
  salaryAmountPay,
  getPaymentData
}) => {
  const [checked, setChecked] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [salaryAmount, setSalaryAmount] = useState(salaryAmountPay);
  const baseURL = import.meta.env.VITE_APP_DJANGO;

  useEffect(() => {
    setSalaryAmount(salaryAmountPay);
  }, [salaryAmountPay]);


  useEffect(() => {
    setSalaryAmount(salaryAmountPay);
  }, [showSalaryModal, salaryAmountPay]);

  const handleCurrencyChange = (selectedOption) => {
    const currencyValue = selectedOption.value;
    setSelectedCurrency(currencyValue);
  };

  const handleAmountChange = (e) => {
    setSalaryAmount(e.target.value);
  };

  const handlePaymentSubmit = async () => {
    try {
      const paymentData = {
        currency: selectedCurrency,
        mail: checked,
        salary_amount: salaryAmount,
      };
      const completeRes = await fetchAuthPost(
        `${baseURL}/api/employee/${employeeId}/salary/${selectedYear}-${selectedMonth}/`,
        {
          body: paymentData,
        }
      );
      toast.success(completeRes.message);
      setShowSalaryModal(false);
      getPaymentData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Modal title="Salary" activeModal={showSalaryModal} onClose={() => setShowSalaryModal(false)}>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Amount
        </label>
        <div className="grid gap-4 mb-4 grid-cols-3">
          <Select
            className="col-span-1"
            classNamePrefix="select"
            options={currency}
            value={currency.find((cur) => cur.value === selectedCurrency)}
            onChange={handleCurrencyChange}
            id="currency"
          />
          <div className="col-span-2">
            <Textinput
              className="w-full"
              id="amount"
              type="number"
              placeholder=""
              onChange={handleAmountChange}
              value={salaryAmount}
            />
          </div>
        </div>
        <div className="w-24">
          <Checkbox
            label="Send Mail"
            value={checked}
            onChange={() => setChecked(!checked)}
          />
        </div>
        <Button
          text="PAY"
          className="btn-dark mt-6 px-6 py-1"
          onClick={handlePaymentSubmit}
        />
      </div>
    </Modal>
  );
};

export default PaymentForm;
