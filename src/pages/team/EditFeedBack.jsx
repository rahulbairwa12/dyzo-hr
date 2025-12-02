import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { fetchAuthPatch } from "@/store/api/apiSlice";
import { toast } from "react-toastify";

const EditFeedBack = ({ isModalOpen, setIsModalOpen, editFeedbackValue, fetchFeedbacks }) => {
    const [loading, setLoading] = useState(false);

    const FormValidationSchema = yup.object({
        comments: yup.string().required("Comments is required"),
    }).required();

    const { register, reset, formState: { errors }, handleSubmit, setValue } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "all",
    });

    useEffect(() => {
        setValue("comments", editFeedbackValue.comments);
    }, [editFeedbackValue, setValue]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const isUpdated = await fetchAuthPatch(`${import.meta.env.VITE_APP_DJANGO}/employee-feedback/patch/${editFeedbackValue?.id}/`, { body: { comments: data.comments } });
            if (isUpdated.status) {
                toast.success("Feedback updated successfully");
                setIsModalOpen(false);
                fetchFeedbacks()
            }

        } catch {
            toast.error("Unable to update feedback");

        } finally {
            setLoading(false);
        }
    };

    const closeEditModal = () => {
        setIsModalOpen(false);
        reset({ comments: editFeedbackValue.comments });
    };

    return (
        <div>
            <Modal title="Edit Feedback" labelclassName="btn-outline-dark" activeModal={isModalOpen} onClose={closeEditModal}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Textarea label="Description" name="comments" register={register} placeholder="Description" rows="10" error={errors.comments} />
                    <div className="ltr:text-right rtl:text-left">
                        <button type="submit" className="btn btn-dark text-center" disabled={loading}>
                            {loading ? 'Update...' : 'Update'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default EditFeedBack;
