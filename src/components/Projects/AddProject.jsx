import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { fetchPOST } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { enforceSubscriptionLimit } from "@/store/planSlice";
import SubscriptionLimitModal from "@/components/subscription/SubscriptionLimitModal";
import { addProjectToTop } from "@/store/projectsSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const AddProject = ({ showAddProjectModal, setShowAddProjectModal, projects, setProjects }) => {
    const userInfo = useSelector((state) => state.auth.user);
    const [loading, setLoading] = useState(false);
    const canAddTask = useSelector((state) => state.plan.canAddTask);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const FormValidationSchema = yup
        .object({
            name: yup.string().required("Project name is required").trim(),
        })
        .required();

    const {
        register,
        reset,
        formState: { errors },
        handleSubmit,
    } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "all",
    });

    const onSubmit = async (data) => {
        // enforce subscription limits
        const allowed = dispatch(enforceSubscriptionLimit());
        if (!allowed) return;

        const formattedData = {
            name: data.name,
            companyId: userInfo.companyId,
            assignee: [],
        };

        try {
            setLoading(true);
            const response = await fetchPOST(
                `${import.meta.env.VITE_APP_DJANGO}/project-v2/${userInfo._id}/`,
                { body: JSON.stringify(formattedData) },
            );
            if (response) {
                dispatch(addProjectToTop(response));
                toast.success("Project created successfully");
                if (typeof setProjects === "function") {
                    setProjects(prevProjects => [response, ...(prevProjects || [])]);
                }
                setShowAddProjectModal(false);
                reset();
                if (response?._id) {
                    navigate(`/project/${response._id}?tab=tasks`);
                }
            }
        } catch (error) {
            console.log("Project creation error:", error);
            toast.error("Unable to create project, " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Modal
                title="Add Project"
                labelclassName="btn-outline-dark"
                activeModal={showAddProjectModal}
                onClose={() => setShowAddProjectModal(false)}
            >
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4 project-form"
                >
                    {/* Normal input instead of Textinput */}
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">
                            Project Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Enter project name"
                            className={`form-control py-2 ${errors.name ? "border-red-500" : ""}`}
                            {...register("name")}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSubmit(onSubmit)();
                                }
                            }}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-center">
                        <button
                            className="btn mt-2.5 btn-dark text-center px-6 py-2.5 bg-electricBlue-50"
                            disabled={loading}
                            type="submit"
                        >
                            {loading ? "Creating..." : "Create Project"}
                        </button>
                    </div>
                </form>
            </Modal>
            <SubscriptionLimitModal />
        </div>
    );
};

export default AddProject;
