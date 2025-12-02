import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import { fetchPOST } from "@/store/api/apiSlice";

const ContactModal = ({ showContactModal, setShowContactModal }) => {

    const [loading, setLoading] = useState(false);

    // Define the Yup validation schema
    const FormValidationSchema = yup.object({
        fullName: yup
            .string()
            .required("Full Name is required")
            .trim()
            .matches(/^\S.*$/, "Full Name cannot be only spaces")
            .matches(/^[^\d]*$/, "Full Name cannot contain numbers")
            .matches(/^[a-zA-Z\s]+$/, "Full Name must contain only letters and spaces"),
        email: yup
            .string()
            .required("Email is required")
            .email("Email is not valid"),
        subject: yup
            .string()
            .required("Subject is required"),

        message: yup
            .string()
            .required("Message is required")
            .min(10, "Message must be at least 10 characters"),
    }).required();

    const {
        register,
        formState: { errors },
        handleSubmit,
        reset,
    } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "all",
    });
    const onSubmit = async (data) => {
        const payload = {
            full_name: data.fullName,
            email: data.email,
            subject: data.subject,
            message: data.message,
        };

        try {
            setLoading(true);
            const response = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/api/send-contact-email/`, {
                body: JSON.stringify(payload),
            });

            if (response.status) {
                toast.success("Message sent successfully");
                setShowContactModal(false);
                reset();
            } else {
                toast.error("Failed to send the message");
            }
        } catch (error) {
            toast.error("An error occurred while sending the message");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Modal
                title="Contact Us"
                labelclassName="btn-outline-dark"
                activeModal={showContactModal}
                onClose={() => {
                    setShowContactModal(false);
                    reset();
                }}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    <Textinput
                        name="fullName"
                        label="Full Name"
                        placeholder="Enter your full name"
                        register={register}
                        error={errors.fullName}
                    />


                    <Textinput
                        name="email"
                        label="Email"
                        placeholder="Enter your email"
                        register={register}
                        error={errors.email}
                    />

                    <Textinput
                        name="subject"
                        label="Subject"
                        placeholder="Enter your subject"
                        register={register}
                        error={errors.email}
                    />



                    <Textarea
                        name="message"
                        label="Message"
                        placeholder="Enter your message"
                        register={register}
                        error={errors.message}
                    />

                    {/* Submit Button */}
                    <div className="ltr:text-right rtl:text-left">
                        <button className="btn btn-dark text-center" disabled={loading}>
                            {loading ? "Sending..." : "Send"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ContactModal;
