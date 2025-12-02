import React, { useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Textinput from "@/components/ui/Textinput";
import { fetchAuthPatch, fetchAuthPut, fetchPOST } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import Select from "react-select";
import { useParams } from "react-router-dom";


const maritalStatusOptions = [
    { value: "Single", label: "Single" },
    { value: "Married", label: "Married" },
];

const validationSchema = yup.object({
    passport_number: yup
        .string()
        .nullable()
        .max(9, "Passport Number cannot exceed 9 characters"),  // Assuming passport number format with max length
    mobile_number: yup
        .string()
        .nullable() // Allows null as a valid value
        .test(
            'is-valid-phone',
            'Phone number must be 10 digits',
            (value) => {
                if (!value) return true; // If the value is null or undefined, skip validation
                return /^\d{10}$/.test(value); // Check if it's 10 digits
            }
        ),
    nationality: yup
        .string()
        .matches(/^[a-zA-Z\s]*$/, "Nationality must contain only letters and spaces")
        .nullable(),

    marital_status: yup
        .string()
        .nullable(),
        // .oneOf(["Single", "Married"], "Invalid Marital Status"),  // Must be one of the provided options
        
    number_of_children: yup
        .number()
        .min(0, "Number of Children cannot be negative")
        .nullable()
        .when("marital_status", {
            is: "Married",
            then: yup.number().required("Number of Children is required for married individuals"),
            otherwise: yup.number().notRequired(),
        }),
}).required();

const PersonalInformationModal = ({ showPersonalInfoModal, setShowPersonalInfoModal, personalInfo, fetchPersonalInfo }) => {
    const { userId } = useParams()
    const { register, handleSubmit, reset, control, formState: { errors }, watch } = useForm({
        resolver: yupResolver(validationSchema),
        mode: "all",
        defaultValues: {
            passport_number: personalInfo.passport_number || "",
            mobile_number: personalInfo.mobile_number || "",
            nationality: personalInfo.nationality || "",
            marital_status: personalInfo.marital_status || "",
            number_of_children: personalInfo.number_of_children || 0,
        },
    });

    const maritalStatus = watch("marital_status");

    useEffect(() => {
        reset({
            passport_number: personalInfo.passport_number || "",
            mobile_number: personalInfo.mobile_number || "",
            nationality: personalInfo.nationality || "",
            marital_status: personalInfo.marital_status || "",
            number_of_children: personalInfo.number_of_children || 0,
        });
    }, [personalInfo, reset]);

    const onSubmit = async (data) => {
        const payload = { ...data, employee: userId };
        try {
            const response = await fetchAuthPut(`${import.meta.env.VITE_APP_DJANGO}/employee/${userId}/personal_information/`, { body: payload });
            if (response.status) {
                toast.success('Details updated successfully');
                fetchPersonalInfo();
                setShowPersonalInfoModal(false);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update details');
        }
    };

    return (
        <Modal
            title="Edit Personal Information"
            labelclassName="btn-outline-dark"
            activeModal={showPersonalInfoModal}
            onClose={() => setShowPersonalInfoModal(false)}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
                    <Textinput
                        name="passport_number"
                        label="Passport Number"
                        placeholder="Passport Number"
                        register={register}
                        error={errors.passport_number}
                    />
                    <Textinput
                        name="mobile_number"
                        label="Mobile Number"
                        placeholder="Mobile Number"
                        register={register}
                        error={errors.mobile_number}
                    />
                    <Textinput
                        name="nationality"
                        label="Nationality"
                        placeholder="Nationality"
                        register={register}
                        error={errors.nationality}
                    />
                    <div>
                        <label className="form-label" htmlFor="marital_status">
                            Marital Status
                        </label>
                        <Controller
                            name="marital_status"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    options={maritalStatusOptions}
                                    className="react-select"
                                    classNamePrefix="select"
                                    onChange={(option) => field.onChange(option ? option.value : '')}
                                    value={maritalStatusOptions.find(option => option.value === field.value)}
                                    id="marital_status"
                                />
                            )}
                        />
                        {errors.marital_status && (
                            <p className="text-red-500 text-sm">{errors.marital_status.message}</p>
                        )}
                    </div>
                    {maritalStatus === "Married" && (
                        <Textinput
                            name="number_of_children"
                            label="Number of Children"
                            placeholder="Number of Children"
                            register={register}
                            error={errors.number_of_children}
                            type="number"
                        />
                    )}
                </div>

                <div className="ltr:text-right rtl:text-left">
                    <button className="btn btn-dark text-center">Save</button>
                </div>
            </form>
        </Modal>
    );
};

export default PersonalInformationModal;
