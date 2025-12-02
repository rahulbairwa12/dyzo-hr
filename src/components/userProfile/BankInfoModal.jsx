import React, { useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Textinput from "@/components/ui/Textinput";
import { fetchAuthPatch, fetchAuthPost } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import Alert from "../ui/Alert";

const validationSchema = yup.object({
    account_number: yup
        .string()
        .matches(/^\d+$/, "Account Number must contain only numbers")
        .min(9, "Account Number must be at least 9 digits long")
        .max(18, "Account Number cannot exceed 18 digits")
        .required("Account Number is required"),

        bank_name: yup
        .string()
        .matches(/^[A-Za-z\s]+$/, "Bank Name must contain only letters and spaces")
        .max(100, "Bank Name cannot exceed 100 characters")
        .required("Bank Name is required"),

    ifsc_code: yup
        .string()
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC Code format")
        .required("IFSC Code is required"),
      

    pan_number: yup
        .string()
        .nullable()  // Allows null as a valid value
        .test(
            "is-valid-pan",
            "Invalid PAN Number format",
            value => value === '' || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value)
        )
        .notRequired(),  // Makes the field optional

}).required();

const BankInfoModal = ({ showBankInfoModal, setShowBankInfoModal, bankInfo, fetchBankInfo }) => {
    const { userId } = useParams()
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        mode: "all",
        defaultValues: {
            account_number: bankInfo.account_number || "",
            bank_name: bankInfo.bank_name || "",
            ifsc_code: bankInfo.ifsc_code || "",
            pan_number: bankInfo.pan_number || "",
        },
    });

    useEffect(() => {
        reset({
            account_number: bankInfo.account_number || "",
            bank_name: bankInfo.bank_name || "",
            ifsc_code: bankInfo.ifsc_code || "",
            pan_number: bankInfo.pan_number || "",
        });
    }, [bankInfo, reset]);

    const onSubmit = async (data) => {
        const payload = { ...data, employee: userId };
        try {
            const response = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/employee/${userId}/bank_details/`, { body: payload });
            if (response.status) {
                toast.success('Account details updated successfully');
                fetchBankInfo();
                setShowBankInfoModal(false);
            }
        } catch (error) {
            toast.error('Failed to update account details');
        }
    };

    return (
        <Modal
            title="Edit Account Information"
            labelclassName="btn-outline-dark"
            activeModal={showBankInfoModal}
            onClose={() => setShowBankInfoModal(false)}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Alert
                    label="Only you and admin can view your bank details."
                    className="alert-primary light-mode"
                />
                <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
                    <Textinput
                        name="account_number"
                        label="Account Number"
                        placeholder="Account Number"
                        register={register}
                        error={errors.account_number}
                    />
                    <Textinput
                        name="bank_name"
                        label="Bank Name"
                        placeholder="Bank Name"
                        register={register}
                        error={errors.bank_name}
                    />
                    <Textinput
                        name="ifsc_code"
                        label="IFSC Code"
                        placeholder="IFSC Code"
                        register={register}
                        error={errors.ifsc_code}
                    />
                    <Textinput
                        name="pan_number"
                        label="PAN Number"
                        placeholder="PAN Number"
                        register={register}
                        error={errors.pan_number}
                    />
                </div>

                <div className="ltr:text-right rtl:text-left">
                    <button className="btn btn-dark text-center">Save</button>
                </div>
            </form>
        </Modal>
    );
};

export default BankInfoModal;
