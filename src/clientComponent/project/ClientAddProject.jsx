import React, { useEffect, useState } from "react";
import Select, { components } from "react-select";
import Modal from "@/components/ui/Modal";
import { useSelector, useDispatch } from "react-redux";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Flatpickr from "react-flatpickr";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { v4 as uuidv4 } from "uuid";
import FormGroup from "@/components/ui/FormGroup";
import { fetchGET, fetchPOST } from "@/store/api/apiSlice";
import { toast } from "react-toastify";

const styles = {
    multiValue: (base, state) => {
        return state.data.isFixed ? { ...base, opacity: "0.5" } : base;
    },
    multiValueLabel: (base, state) => {
        return state.data.isFixed
            ? { ...base, color: "#626262", paddingRight: 6 }
            : base;
    },
    multiValueRemove: (base, state) => {
        return state.data.isFixed ? { ...base, display: "none" } : base;
    },
    option: (provided, state) => ({
        ...provided,
        fontSize: "14px",
    }),
};


const options = [

    {
        value: "low",
        label: "low",
    },
    {
        value: "medium",
        label: "medium",
    },
    {
        value: "high",
        label: "high",
    },
];


const currencyOptions = [

    {
        value: "INR",
        label: "INR",
    },
    {
        value: "USD",
        label: "USD",
    },
    {
        value: "EURO",
        label: "EURO",
    },
];

const OptionComponent = ({ data, ...props }) => {
    //const Icon = data.icon;

    return (
        <components.Option {...props}>
            <span className="flex items-center space-x-4">
                <div className="flex-none">
                    <div className="h-7 w-7 rounded-full">
                        <img
                            src={data.image}
                            alt=""
                            className="w-full h-full rounded-full"
                        />
                    </div>
                </div>
                <span className="flex-1">{data.label}</span>
            </span>
        </components.Option>
    );
};

const ClinetAddProject = ({ showAddProjectModal, setShowAddProjectModal, fetchProjects }) => {

    const userInfo = useSelector((state) => state.auth.user)
    const [assigneeOptions, setAssigneeOptions] = useState([{}])


    useEffect(() => {
        const fetchEmployeeList = async () => {
            try {
                const { data } = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/employee/list/${userInfo.companyId}/`)
                const options = data
                .filter(emp => emp.isActive) // Filter active employees
                .map((emp) => ({
                    value: emp._id,
                    label: emp.name,
                    image: `${import.meta.env.VITE_APP_DJANGO}${emp.profile_picture}`
                }));
                setAssigneeOptions(options)
            } catch (error) {
            }
        }
        fetchEmployeeList()

    }, [])

  
    const FormValidationSchema = yup
        .object({
            name: yup.string().required("Project name is required"),
        })
        .required();

    const {
        register,
        control,
        reset,
        formState: { errors },
        handleSubmit,
    } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "all",
    });

    const onSubmit = async (data) => {
        const formattedData = {
            ...data,
            companyId: userInfo.companyId,
            client: data.client, // Ensure this is just an ID
            currencyType: data.currencyType, // Ensure this is a string
            dueDate: data.dueDate, // Ensure this is formatted as "YYYY-MM-DD"
            priority: data.priority // Ensure this is a string
        };

        try {
            const response = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/project/`, {
                body: JSON.stringify(formattedData)
            });
            if (response.status) {
                toast.success('Project created successfully');
                fetchProjects()
                setShowAddProjectModal(false);
            } else {
                toast.error('Failed to create project');
            }
        } catch (error) {
            toast.error('Internal server error while creating project');
        }
    };


    return (
        <div>
            <Modal
                title="Create Project"
                labelclassName="btn-outline-dark"
                activeModal={showAddProjectModal}
                onClose={() => setShowAddProjectModal(false)}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
                    <Textinput
                        name="name"
                        label="Project Name"
                        placeholder="Project Name"
                        register={register}
                        error={errors.name}
                    />

                    <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">

                        <Textinput
                            name="client"
                            label="Client Name"
                            placeholder="Client Name"
                            register={register}

                        />

                        <FormGroup
                            label="Due Date"
                            id="default-picker2"
                        >
                            <Controller
                                name="dueDate"
                                control={control}
                                render={({ field }) => (
                                    <Flatpickr
                                        className="form-control py-2"
                                        id="default-picker2"
                                        placeholder="yyyy, dd M"
                                        value={field.value ? new Date(field.value) : new Date()}
                                        onChange={(date) => {
                                            field.onChange(date[0].toISOString().split('T')[0]);  // Format the date as "YYYY-MM-DD"
                                        }}
                                        options={{
                                            altInput: true,
                                            altFormat: "F j, Y",
                                            dateFormat: "Y-m-d",
                                        }}
                                    />
                                )}
                            />


                        </FormGroup>

                        <div>
                            <label className="form-label" htmlFor="icon_s">
                                Assignee
                            </label>
                            <Controller
                                name="assign"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={assigneeOptions}
                                        styles={styles}
                                        className="react-select"
                                        classNamePrefix="select"
                                        isMulti
                                        components={{
                                            Option: OptionComponent,
                                        }}
                                        id="icon_s"
                                    />
                                )}
                            />

                        </div>


                        <div>
                            <label className="form-label" htmlFor="icon_s">
                                Priority
                            </label>
                            <Controller
                                name="priority"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={options}
                                        styles={styles}
                                        className="react-select"
                                        classNamePrefix="select"
                                        isMulti={false}
                                        onChange={(option) => field.onChange(option ? option.value : '')}
                                        value={options.find(option => option.value === field.value)}
                                        id="icon_s"
                                    />
                                )}
                            />




                        </div>

                        <Textinput
                            name="stagingServerURL"
                            label="Staging Server Url"
                            placeholder="https://example.com"
                            register={register}

                        />

                        <Textinput
                            name="liveServerURL"
                            label="Live Server Url"
                            placeholder="https://example.com"
                            register={register}

                        />


                        <div>
                            <label className="form-label" htmlFor="icon_s">
                                Currency
                            </label>
                            <Controller
                                name="currencyType"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={currencyOptions}
                                        styles={styles}
                                        className="react-select"
                                        classNamePrefix="select"
                                        isMulti={false}
                                        onChange={(option) => field.onChange(option ? option.value : '')}
                                        value={currencyOptions.find(option => option.value === field.value)}
                                        id="icon_s"
                                    />
                                )}
                            />


                        </div>

                        <Textinput
                            name="budget"
                            label="Budget"
                            placeholder="Budget"
                            register={register}
                        />

                    </div>

                    <Textarea label="Description" name='description' register={register} placeholder="Description" />

                    <div className="ltr:text-right rtl:text-left">
                        <button className="btn btn-dark  text-center">Add</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ClinetAddProject;
