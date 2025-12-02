
import { React, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useSelector } from "react-redux";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { fetchPOST } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { sendNotification } from "@/helper/helper";
import { useEmployeeAuth } from "@/context/EmployeeContext";

const AddNoticeModal = ({ showAddNoticeModal, setShowAddNoticeModal, fetchNoices }) => {

    const userInfo = useSelector((state) => state.auth.user)
    const { employeeList } = useEmployeeAuth()
    const [loading, setLoading] = useState(false);
    const baseUrl = window.location.origin

    const FormValidationSchema = yup.object({
        title: yup.string().required("Title is required"),
        text: yup.string().required("Text is required"),
    }).required();

    const { register, control, reset, formState: { errors }, handleSubmit, } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "all",
    });

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const response = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/api/notices/create/${userInfo?.companyId}/`, { body: { title: data?.title, note: data?.text, company: userInfo.companyId, employee: userInfo?._id } });
            if (response.status) {
                toast.success('Notice added successfully');
                {
                    employeeList.map(async (user) =>
                        await sendNotification(`${response?.data?.employee_name} has created a notice`, 'Notice Alert', 'userId', user?._id, { 'Message': 'Notice Alert' }, `${baseUrl}/login?redirect=/dashboard`)
                    )
                }

                fetchNoices()
                setShowAddNoticeModal(false); 
                reset()
            }
        } catch (error) {
            toast.error('Failed to add notice');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div>
            <Modal
                title="Add Notice"
                labelclassName="btn-outline-dark"
                activeModal={showAddNoticeModal}
                onClose={() => setShowAddNoticeModal(false)}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
                    <Textinput
                        name="title"
                        label="Title"
                        placeholder="Type here"
                        register={register}
                        error={errors.title}
                    />


                    <Textarea label="Text" name='text' register={register} placeholder="Text" error={errors.text} />

                    <div className="ltr:text-right rtl:text-left">
                        <button className="btn btn-dark  text-center">{loading ? 'Adding...' : 'Add'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AddNoticeModal;
