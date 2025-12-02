import React from "react";
import { useSelector } from "react-redux";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import { fetchAuthFilePost } from "@/store/api/apiSlice";


const ShareClientModal = ({ showShareClientModal, setShowShareClientModal, clients }) => {

    const userInfo = useSelector((state) => state.auth.user)

    const FormValidationSchema = yup.object({ email: yup.string().required("Email is required").email("Email is not valid") }).required();

    const { register, control, reset, formState: { errors }, handleSubmit, } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "all",
    });

    const convertToCSV = (data) => {
        if (!data || data.length === 0) return '';
        const newData = data.map(({ _id, projectId, companyId, pay_per_month, password, projects, userId, dateCreated, ...rest }) => rest);
        const headers = Object.keys(newData[0]).join(",");
        const rows = newData.map((row) => Object.values(row).join(",")).join("\n");
        return `${headers}\n${rows}`;
    };

    const onSubmit = async (data) => {

        const convertIntoCsv = convertToCSV(clients)

        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("body", `${userInfo.name} has shared clients with you. Please find the attached CSV file.`);
        formData.append("subject", `${userInfo.name} has shared clients with you`);
        formData.append("csvFileName", "clients.csv");
        formData.append("csvData", convertIntoCsv);

        try {
            const result = await fetchAuthFilePost(`${import.meta.env.VITE_APP_DJANGO}/send-email-with-csv-attachment/`, { body: formData });
            if (result.status) {
                toast.success('Shared successfully');
                setShowShareClientModal(false);
                reset();
            } else {
                toast.error(result.message || 'Failed to share');
            }
        } catch (error) {
            toast.error('Failed to share');
        }
    };


    return (
        <div>
            <Modal
                title="Share"
                labelclassName="btn-outline-dark"
                activeModal={showShareClientModal}
                onClose={() => setShowShareClientModal(false)}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
                    <Textinput
                        name="email"
                        label="Eamil"
                        placeholder="Email"
                        register={register}
                        error={errors.email}
                    />

                    <div className="ltr:text-right rtl:text-left">
                        <button className="btn btn-dark  text-center">Share</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ShareClientModal;
