import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const steps = [{ id: 3, title: "Welcome" }];

const AdminOnboarding = () => {
    const [stepNumber, setStepNumber] = useState(0);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
        try {
            setLoading(true);
            toast.success("Welcome to Dyzo!");
            navigate("/dashboard");
        } catch (error) {
            toast.error("Error in submission");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <Card title="Welcome to Dyzo!" className="w-full max-w-4xl mx-4 md:mx-auto p-6 md:p-8 lg:p-10 shadow-lg">
                <div>
                    <div className="flex items-center justify-center md:mx-8">
                        {steps.map((item, i) => (
                            <div
                                className="relative flex flex-start flex-1 last:flex-none group"
                                key={i}
                            >
                                <div
                                    className={`${stepNumber >= i
                                        ? "bg-slate-900 text-white ring-slate-900 ring-offset-2 dark:ring-offset-slate-500 dark:bg-slate-900 dark:ring-slate-900"
                                        : "bg-white ring-slate-900 ring-opacity-70 text-slate-900 dark:text-slate-300 dark:bg-slate-600 dark:ring-slate-600 text-opacity-70"
                                        } transition duration-150 icon-box h-7 w-7 md:h-12 md:w-12 rounded-full flex items-center justify-center relative z-[66] ring-1 text-sm md:text-lg font-medium`}
                                >
                                    <span>{i + 1}</span>
                                </div>

                                <div
                                    className={` ${stepNumber >= i
                                        ? "bg-slate-900 dark:bg-slate-900"
                                        : "bg-[#E0EAFF] dark:bg-slate-700"
                                        } absolute top-1/2 transform -translate-y-1/2 h-[2px] w-full`}
                                ></div>
                                <div
                                    className={` ${stepNumber >= i
                                        ? "text-slate-900 dark:text-slate-300"
                                        : "text-slate-500 dark:text-slate-300 dark:text-opacity-40"
                                        } absolute top-full text-xs md:text-base mt-3 transition duration-150`}
                                >
                                    <span className="w-max">{item.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="conten-box my-14 px-4 md:px-0">
                        <form onSubmit={onSubmit}>
                            {stepNumber === 0 && (
                                <div className="my-12">
                                    <div className="text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap">
                                        <p>Welcome to Dyzo!</p>
                                        <p className="mt-4">
                                            Your all-in-one solution for managing tasks, tracking time, and staying organized. With Dyzo, you can seamlessly handle projects,
                                            monitor progress, and ensure nothing falls through the cracks. Whether you're working solo or collaborating with a team, our intuitive
                                            interface and powerful features are designed to boost your productivity and keep you on track.
                                        </p>
                                        <p className="mt-4">
                                            Start exploring today and take control of your workflow like never before!
                                        </p>
                                        <p className="mt-4">
                                            - The Dyzo Team
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="text-center md:text-right mt-10">
                                <Button
                                    text={loading ? "Submitting..." : "Get Started"}
                                    className="btn-dark w-full md:w-auto"
                                    type="submit"
                                    disabled={loading}
                                />
                            </div>
                        </form>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AdminOnboarding;
