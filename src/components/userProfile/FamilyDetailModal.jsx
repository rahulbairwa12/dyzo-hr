import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Textinput from "@/components/ui/Textinput";
import { fetchAuthPost } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

const validationSchema = yup.object({
    name: yup.string().required("Name is required"),
    relationship: yup.string().required("Relation is required"),
    mobile_number: yup.string().required("Mobile Number is required"),
}).required();

const FamilyDetailModal = ({ showFamilyDetailModal, setShowFamilyDetailModal, fetchFamilyInfo }) => {
    const { userId } = useParams()
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        mode: "all",
    });


    const onSubmit = async (data) => {
        const payload = { ...data, employee: userId };
        try {
            setLoading(true);
            const response = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/employee/${userId}/family_details/`, { body: payload });
            if (response.status) {
                toast.success('Family details updated successfully');
                setShowFamilyDetailModal(false);
                reset();
                fetchFamilyInfo()
            }
        } catch (error) {
            toast.error('Failed to create family details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Family Details"
            labelclassName="btn-outline-dark"
            activeModal={showFamilyDetailModal}
            onClose={() => setShowFamilyDetailModal(false)}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <Textinput
                    name="name"
                    label="Name"
                    placeholder="Enter Name"
                    register={register}
                    error={errors.name}
                />
                <Textinput
                    name="relationship"
                    label="Relation"
                    placeholder="Enter Relation"
                    register={register}
                    error={errors.relationship}
                />
                <Textinput
                    name="mobile_number"
                    label="Phone Number"
                    placeholder="Enter Phone Number"
                    register={register}
                    error={errors.mobile_number}
                />


                <div className="ltr:text-right rtl:text-left">
                    <button className="btn btn-dark text-center" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
                </div>
            </form>
        </Modal>
    );
};

export default FamilyDetailModal;
