// DownloadApp.jsx
import React, { useState, useEffect, useRef } from 'react';
import dyzoLogo from '../../assets/images/landing_page/dyzonamelogo.png';
import herobackground from '../../assets/images/landing_page/inviteEmp.webp';
import Textinput from '../ui/Textinput';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { fetchPOST, fetchAuthPost } from '../../store/api/apiSlice';
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useSelector } from 'react-redux';
import { Icon } from '@iconify/react';

// Define the validation schema
const FormValidationSchema = yup.object().shape({
    email: yup.string().email("Invalid email format"),
});

const DownloadApp = () => {
    const navigate = useNavigate();
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const userInfo = useSelector((state) => state.auth.user);

    const { register, formState: { errors }, setValue } = useForm({
        resolver: yupResolver(FormValidationSchema),
    });

    const cname = userInfo._id;
    const companyId = userInfo.companyId;

    const isValidEmail = (email) => FormValidationSchema.fields.email.isValidSync(email);

    const handleKeyDown = (evt) => {
        if (evt.key === "Enter") {
            evt.preventDefault();
            const trimmedValue = evt.target.value.trim();

            if (trimmedValue && isValidEmail(trimmedValue) && !emails.includes(trimmedValue)) {
                setEmails([...emails, trimmedValue]);
                setValue("email", ""); // Clear the email input
                evt.target.value = ""; // Clear input field
            } else {
                toast.error("Please enter a valid email address");
            }
        }
    };

    const handlePaste = (evt) => {
        evt.preventDefault();
        const paste = evt.clipboardData.getData("text");
        const pastedEmails = paste
            .split(/[\s,]+/)
            .map(email => email.trim())
            .filter(email => email && isValidEmail(email) && !emails.includes(email));

        if (pastedEmails.length > 0) {
            setEmails([...emails, ...pastedEmails]);
        } else {
            toast.error("Please paste valid email addresses only");
        }
    };

    const handleSubmitForm = async () => {
        const payload = {
            cname,
            companyId,
            message: "",
            email: emails,
        };

        if (emails.length === 0) {
            navigate("/tasks");
            return;
        }

        setLoading(true);
        try {
            const response = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/invite/`, {
                body: payload,
            });

            if (response.status) {
                toast.success("Invite sent successfully");
                navigate(`/tasks?userId=${userInfo._id}`);
            } else {
                toast.error("Failed to send invite");
            }
        } catch (error) {
            toast.error("Failed to send invite");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Ref for the email input to auto-focus
    const emailInputRef = useRef(null);

    // Auto-focus the email input on component mount
    useEffect(() => {
        if (emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, []);

    return (
        <div className="p-8 dark:bg-white">
            <div>
                <img src={dyzoLogo} alt="Dyzo logo" className="rounded-full" />
            </div>

            <div className="flex flex-col-reverse lg:grid lg:grid-cols-[0.3fr_0.7fr] gap-5 px-4 mt-8">
                <div>
                    <h2 className="text-3xl mb-4 text-black-500 leading-10 font-normal dark:text-black-500">
                        Invite Your Teammates
                    </h2>
                    <p className="text-[#1e1f21] text-xl font-medium mb-8 dark:text-black-500">
                        Dyzo improves teamwork and helps manage your team efficiently.
                    </p>

                    <Textinput
                        type="text"
                        label="Your team member email address"
                        name="email"
                        register={register}
                        className='w-full p-4 border rounded dark:border-gray-300 dark:bg-white dark:text-black-500 text-lg'
                        error={errors.email ? errors.email.message : ""}
                        placeholder="Enter email addresses separated by Enter"
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        ref={emailInputRef} // Attach the ref for auto-focus
                        autoComplete="off" // Prevent browser autocomplete
                    />

                    <div className="flex flex-wrap my-4 text-center">
                        {emails.map(email => (
                            <div key={email} className="bg-gray-200 rounded-lg p-2 mr-2 mb-2 flex items-center dark:bg-black-500">
                                <span className="mr-2">{email}</span>
                                <button
                                    type="button"
                                    className="text-red-500 focus:outline-none dark:text-white"
                                    onClick={() => setEmails(emails.filter(e => e !== email))}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>

                    <Button
                        text={loading ? <Icon icon="tabler:circle" className='w-5 h-5 m-auto animate-spin' /> : "Let’s get started"}
                        className="bg-black-500 text-white px-4 py-2 rounded mt-3 w-full cursor-pointer"
                        onClick={handleSubmitForm}
                        disabled={loading}
                    />

                    <div className='text-center'>
                        <button
                            className="text-blue-600 px-1 py-1 mt-3 underline text-sm rounded hover:text-blue-700 transition-colors"
                            onClick={() => { navigate(`/tasks?userId=${userInfo._id}`) }}>
                            Skip
                        </button>
                    </div>
                </div>

                <div className="border-t-8 border-gray-300 rounded-lg overflow-hidden">
                    <div className="w-full h-8 bg-gray-300 flex items-center px-4 space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    </div>

                    <div className="p-4">
                        <div className="flex items-center mb-4 gap-3">
                            <div className="bg-teal-200 p-4 rounded">
                                <Icon icon="mdi:user-outline" className="w-8 h-8 text-white" />
                            </div>
                            <span className='dark:text-black-500'> Invite User</span>
                        </div>

                        <ul className="space-y-6">
                            {
                                emails.length > 0 ? (
                                    emails.map((item, index) => (
                                        <li className="flex items-center dark:text-black-600" key={index}>
                                            <Icon icon="gg:check-o" className="w-10 h-10 mr-3" />
                                            <span className='dark:text-black-500'>{item}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="flex items-center dark:text-black-600">
                                        <Icon icon="gg:check-o" className="w-10 h-10 mr-3" />
                                        <div className="w-full h-8 bg-gray-200 rounded animate-pulse"></div>
                                    </li>
                                )
                            }
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DownloadApp;
