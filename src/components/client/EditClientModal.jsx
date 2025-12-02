import React, { useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { fetchAuthPatch, fetchPOST } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import Switch from "@/components/ui/Switch";
import { useState } from "react";

const EditClientModal = ({ showEditClientModal, setShowEditClientModal, fetchClient, selectedClientData }) => {

    const userInfo = useSelector((state) => state.auth.user);
    const [isClientActive, setIsClientActive] = useState(selectedClientData?.isActive || false);
    const [getEmail, setGetEmail] = useState(selectedClientData?.getEmail || false);

    const FormValidationSchema = yup.object({
        first_name: yup.string().required("Name is required"),
        email: yup.string().required("Email is required").email("Email is not valid"),
        phone: yup.string().nullable().matches(/^[0-9()+\-\s]*$/, "Phone number is not valid"),
    });



    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: yupResolver(FormValidationSchema),
        defaultValues: {
            first_name: selectedClientData?.first_name || "",
            last_name: selectedClientData?.last_name || "",
            email: selectedClientData?.email || "",
            phone: selectedClientData?.phone || "",
        },
    });
    useEffect(() => {

        reset({
            first_name: selectedClientData?.first_name || "",
            last_name: selectedClientData?.last_name || "",
            email: selectedClientData?.email || "",
            phone: selectedClientData?.phone || "",

        });
        setIsClientActive(selectedClientData?.isActive || false);
        setGetEmail(selectedClientData?.getEmail || false);
    }, [selectedClientData]);



    const onSubmit = async (data) => {

        const formattedData = {
            first_name: data?.first_name,
            last_name: data?.last_name,
            email: data?.email,
            phone: data?.phone,
            companyId: userInfo.companyId,
            getEmail: getEmail,
            isActive: isClientActive,
        };
        try {
            const response = await fetchAuthPatch(`${import.meta.env.VITE_APP_DJANGO}/employee/${selectedClientData?._id}/`, { body: formattedData });
            if (response.status) {
                toast.success('Client updated successfully');
                fetchClient();
                setShowEditClientModal(false);
                reset(); // Reset form after successful submission
            }
        } catch (error) {
        
            toast.error('Failed to update client');
        }
    };

    return (
        <div>
            <Modal
                title="Edit Client"
                labelclassName="btn-outline-dark"
                activeModal={showEditClientModal}
                onClose={() => setShowEditClientModal(false)}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
                    <Textinput
                        name="first_name"
                        label="First Name"
                        placeholder="First Name"
                        register={register}
                        error={errors.first_name}
                    />
                    <Textinput
                        name="last_name"
                        label="Last Name"
                        placeholder="Last Name"
                        register={register}
                        error={errors.last_name}
                    />

                    <Textinput
                        name="email"
                        label="Email"
                        placeholder="Email"
                        register={register}
                        error={errors.email?.message}
                    />

                    <Textinput
                        name="phone"
                        label="Phone"
                        placeholder="Phone"
                        register={register}
                        error={errors.phone?.message}
                    />

                    <div className="flex flex-wrap space-xy-5">
                        <Switch
                            label="Get Notification"
                            activeClass="bg-primary-500"
                            value={getEmail}
                            onChange={() => setGetEmail(!getEmail)}
                            badge
                            prevIcon="material-symbols-light:mail-outline"
                            nextIcon="material-symbols-light:mail-off-outline"
                        />
                        <Switch
                            label="Active"
                            activeClass="bg-secondary-500"
                            value={isClientActive}
                            onChange={() => setIsClientActive(!isClientActive)}
                            badge
                            prevIcon="heroicons-outline:check"
                            nextIcon="heroicons-outline:x"
                        />

                    </div>



                    <div className="ltr:text-right rtl:text-left">
                        <button type="submit" className="btn btn-dark  text-center">Update</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default EditClientModal;
