import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "../ui/Button";
import { Controller, useForm } from "react-hook-form";
import Select from "react-select";
import { fetchAuthGET } from "@/store/api/apiSlice";
import Icons from "../ui/Icon";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

const TransferEmployee = ({ showModal, onClose, handleTransfer, loading }) => {
    const { userId } = useParams();
    const userInfo = useSelector((state) => state.auth.user);
    const { control, handleSubmit, watch } = useForm();
    const [assigneeOptions, setAssigneeOptions] = useState([]);
    const [transferModel, setTransferModel] = useState(false);
    const [selected, setSelected] = useState([]);
    const [employeeActivity, setEmployeeActivity] = useState("inactive");

    const checkboxOptions = [
        { label: 'Tasks', value: 'Tasks' },
        { label: 'TaskLogs', value: 'TaskLogs' },
        { label: 'Screenshot', value: 'Screenshot' },
        { label: 'Leave', value: 'Leave' },
    ];

    const selectedEmployee = watch("assign");

    // Fetch employee list
    useEffect(() => {
        const fetchEmployeeList = async () => {
            try {
                const { data } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/employee/list/${userInfo.companyId}/`);
                const options = data
                    .filter(emp => emp.isActive && emp._id !== userInfo._id) // Exclude the current user from the options
                    .map((emp) => ({
                        value: emp._id,
                        label: emp.name,
                        image: `${emp.profile_picture}`
                    }));
                setAssigneeOptions(options);
            } catch (error) {
            }
        };

        fetchEmployeeList();
    }, [userInfo]);

    // Handle the API call when "Done" is clicked
    const onSubmit = (data) => {
        const payload = {
            source_employee_id: userId,
            target_employee_id: data.assign.value,
            Tasks: selected.includes('Tasks'),
            TaskLogs: selected.includes('TaskLogs'),
            Screenshot: selected.includes('Screenshot'),
            Leave: selected.includes('Leave'),
            employee_activity: employeeActivity
        };
        return
        handleTransfer(payload);
    };

    // Embedded Checkbox component
    const Checkbox = ({ name, label, value, onChange }) => (
        <div className="flex items-center">
            <input
                type="checkbox"
                name={name}
                checked={value}
                onChange={onChange}
                className="form-checkbox h-5 w-5 text-blue-600"
            />
            <label htmlFor={name} className="ml-2 text-slate-900 dark:text-white">
                {label}
            </label>
        </div>
    );

    return (
        <div>
            {/* {userInfo?.isAdmin && (
                <span onClick={() => setTransferModel(true)}>
                    <Icons icon="mingcute:transfer-3-fill" className="w-6 h-6 cursor-pointer" />
                </span>
            )} */}

            <Modal title="Transfer User Data" activeModal={showModal} onClose={onClose}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="p-4">

                        {/* Employee Select Dropdown with Label */}
                        <label className="block mb-2 form-label">Select User For Data Handover:</label>
                        <Controller
                            name="assign"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    options={assigneeOptions}
                                    className="react-select"
                                    classNamePrefix="select"
                                    isClearable
                                />
                            )}
                        />

                        {/* Show checkboxes only when an employee is selected */}
                        {selectedEmployee && (
                            <div>
                                <div className="space-y-4 mt-4">
                                    <label className="block mb-2 form-label">Select Which Data You Want To Transfer</label>
                                    {checkboxOptions.map((option, i) => (
                                        <Checkbox
                                            key={i}
                                            name={option.value}
                                            label={option.label}
                                            value={selected.includes(option.value)}
                                            onChange={() => {
                                                if (selected.includes(option.value)) {
                                                    setSelected(selected.filter((item) => item !== option.value));
                                                } else {
                                                    setSelected([...selected, option.value]);
                                                }
                                            }}
                                        />
                                    ))}

                                    {/* Display the selected checkboxes */}
                                    {selected.length > 0 && (
                                        <div className="text-slate-900 dark:text-white">
                                            You have chosen to transfer: [{selected.join(", ")}]
                                        </div>
                                    )}
                                </div>

                                {/* Employee Activity with react-select */}
                                <label className="block mt-4 form-label">Select Action For Transfer Employee:</label>
                                <Controller
                                    name="employee_activity"
                                    control={control}
                                    defaultValue={employeeActivity}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            value={employeeActivity}
                                            onChange={(e) => {
                                                setEmployeeActivity(e.target.value);
                                                field.onChange(e.target.value);
                                            }}
                                            className="form-select block w-full mt-1 p-2.5 bg-white border border-gray-300 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                        >
                                            <option value="delete">Delete</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="none">None</option>
                                        </select>
                                    )}
                                />
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex justify-center space-x-4 mt-8">
                            <Button
                                text="Done"
                                className="btn-dark dark:bg-slate-800 h-min text-sm font-normal"
                                onClick={handleSubmit(onSubmit)}
                                isLoading={loading}
                                disabled={loading}
                            />
                            <Button
                                text="Cancel"
                                className="btn-dark dark:bg-slate-800 h-min text-sm font-normal"
                                onClick={onClose}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TransferEmployee;
