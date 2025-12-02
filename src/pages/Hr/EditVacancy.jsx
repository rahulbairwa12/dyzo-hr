import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSelector } from 'react-redux';
import { patchUpdateAPI } from '@/store/api/apiSlice';
import { toast } from 'react-toastify';
import Select from '@/components/ui/Select';
import Textinput from '@/components/ui/Textinput';
import TextEditor from '@/components/ui/TextEditor';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthToken } from '@/utils/authToken';

// Helper function to format dates to YYYY-MM-DD
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Validation schema
const schema = yup.object().shape({
    job_title: yup.string().required('Title is required'),
    job_description: yup.string().required('Job description is required'),
    work_arrangement: yup.string().oneOf(['remote', 'on-site', 'hybrid'], 'Invalid work arrangement').required('Work arrangement is required'),
    employment_type: yup.string().oneOf(['full-time', 'part-time'], 'Invalid employment type').required('Employment type is required'),
    level: yup.string().oneOf(['fresher', 'mid-level', 'mid-sr-level', 'Advance'], 'Invalid level').required('Level is required'),
    shift: yup.string().oneOf(['day', 'night', 'flexible'], 'Invalid shift').required('Shift is required'),
    skills: yup.string().required('Skills are required'),
    job_role: yup.string().required('About this role is required'),
    start_date: yup.date().required('Start date is required').nullable(),
    end_date: yup.date().required('End date is required').nullable().min(yup.ref('start_date'), 'End date must be later than start date'),
});

const DateInput = ({ label, name, register, error, defaultValue }) => (
    <div className={`formGroup ${error ? 'has-error' : ''}`}>
        {label && (
            <label htmlFor={name} className="block capitalize form-label">
                {label}
            </label>
        )}
        <div className="relative">
            <input
                type="date"
                id={name}
                {...register(name)}
                className={`form-control py-2 ${error ? 'border-red-500' : ''}`}
                defaultValue={defaultValue || ''}
            />
            {error && (
                <div className="mt-2 text-danger-500 block text-sm">{error.message}</div>
            )}
        </div>
    </div>
);

const EditVacancy = () => {
    const { jobid } = useParams();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors }, setValue, reset, getValues } = useForm({
        resolver: yupResolver(schema),
    });
    const companyId = useSelector((state) => state.auth.user.companyId);
    const [initialData, setInitialData] = useState(null);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = getAuthToken();
                const response = await fetch(`${import.meta.env.VITE_APP_DJANGO}/api/job/${jobid}/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();

                if (response.ok) {
                    setInitialData(data.data);
                } else {
                    toast.error('Failed to fetch initial data');
                }
            } catch (error) {
                toast.error('An error occurred while fetching initial data');
            }
        };

        fetchInitialData();
    }, [jobid]);

    useEffect(() => {
        if (initialData) {
            reset({
                job_title: initialData.job_title,
                work_arrangement: initialData.work_arrangement,
                employment_type: initialData.employment_type,
                level: initialData.level,
                shift: initialData.shift,
                skills: initialData.skills,
                job_role: initialData.job_role,
                job_description: initialData.job_description,
                start_date: formatDate(initialData.start_date),
                end_date: formatDate(initialData.end_date),
            });
            setIsActive(initialData.is_active);

            // Set TextEditor values
            setValue('job_description', initialData.job_description || '');
            setValue('job_role', initialData.job_role || '');
        }
    }, [initialData, reset, setValue]);

    const handleEditVacancy = async (formData) => {
        const updatedData = {
            ...formData,
            start_date: formatDate(formData.start_date),
            end_date: formatDate(formData.end_date),
            is_active: isActive,
            companyId,
        };

        try {
            const response = await patchUpdateAPI(`api/edit-recruitment/${jobid}/`, {
                body: JSON.stringify(updatedData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 1) {
                toast.success('Vacancy updated successfully');
                navigate('/HR-contrl-desk');
            } else {
                if (response.errors) {
                    Object.entries(response.errors).forEach(([field, messages]) => {
                        toast.error(`${field}: ${messages.join(', ')}`);
                    });
                } else {
                    toast.error(response.message || 'Failed to update vacancy');
                }
            }
        } catch (error) {
            toast.error('An error occurred while updating the vacancy');
        }
    };

    if (!initialData) {
        return <div>Loading...</div>;
    }

    return (
        <form onSubmit={handleSubmit(handleEditVacancy)}>
            <div className="grid grid-cols-1 gap-4">
                <Textinput
                    name="job_title"
                    label="Job Title"
                    register={register}
                    error={errors?.job_title}
                    placeholder="Enter job title"
                />
                {errors.job_title && <p className="text-red-500 text-sm">{errors.job_title.message}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Select
                        name="work_arrangement"
                        label="Work Arrangement"
                        register={register}
                        error={errors?.work_arrangement}
                        options={[
                            { value: 'remote', label: 'Remote' },
                            { value: 'on-site', label: 'On-site' },
                            { value: 'hybrid', label: 'Hybrid' },
                        ]}
                    />
                    {errors.work_arrangement && <p className="text-red-500 text-sm">{errors.work_arrangement.message}</p>}

                    <Select
                        name="employment_type"
                        label="Employment Type"
                        register={register}
                        error={errors?.employment_type}
                        options={[
                            { value: 'full-time', label: 'Full-time' },
                            { value: 'part-time', label: 'Part-time' },
                        ]}
                    />
                    {errors.employment_type && <p className="text-red-500 text-sm">{errors.employment_type.message}</p>}

                    <Select
                        name="level"
                        label="Level"
                        register={register}
                        error={errors?.level}
                        options={[
                            { value: 'fresher', label: 'Fresher' },
                            { value: 'mid-level', label: 'Mid-Level' },
                            { value: 'mid-sr-level', label: 'Mid-Senior-Level' },
                            { value: 'Advance', label: 'Advance' },
                        ]}
                    />
                    {errors.level && <p className="text-red-500 text-sm">{errors.level.message}</p>}

                    <Select
                        name="shift"
                        label="Shift"
                        register={register}
                        error={errors?.shift}
                        options={[
                            { value: 'day', label: 'Day' },
                            { value: 'night', label: 'Night' },
                            { value: 'flexible', label: 'Flexible' },
                        ]}
                    />
                    {errors.shift && <p className="text-red-500 text-sm">{errors.shift.message}</p>}
                </div>

                <Textinput
                    name="skills"
                    label="Skills"
                    register={register}
                    error={errors?.skills}
                    placeholder="Enter skills"
                />
                {errors.skills && <p className="text-red-500 text-sm">{errors.skills.message}</p>}

                <div className="mb-5 relative w-full">
                    <label htmlFor="job_description">Job Description</label>
                    <TextEditor
                        id="job_description"
                        onChange={(content) => setValue('job_description', content)}
                        value={getValues('job_description')}
                        classes="border border-inherit rounded-sm mt-2"
                        
                    />
                    {errors.job_description && (
                        <p className="text-red-500 text-sm">{errors.job_description.message}</p>
                    )}
                </div>

                <div className="mb-5 relative w-full">
                    <label htmlFor="job_role">About This Role</label>
                    <TextEditor
                        id="job_role"
                        onChange={(content) => setValue('job_role', content)}
                        value={getValues('job_role')}
                        classes="border border-inherit rounded-sm mt-2"
                    />
                    {errors.job_role && (
                        <p className="text-red-500 text-sm">{errors.job_role.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DateInput
                        name="start_date"
                        label="Start Date"
                        register={register}
                        error={errors?.start_date}
                    />
                    {errors.start_date && <p className="text-red-500 text-sm">{errors.start_date.message}</p>}

                    <DateInput
                        name="end_date"
                        label="End Date"
                        register={register}
                        error={errors?.end_date}
                    />
                    {errors.end_date && <p className="text-red-500 text-sm">{errors.end_date.message}</p>}
                </div>

                <label className="inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isActive}
                        onChange={() => setIsActive(!isActive)}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Active</span>
                </label>

                <div className="flex justify-end mt-4">
                    <button type="submit" className="btn btn-dark text-center dark:border-2 dark:border-white">
                        Update Vacancy
                    </button>
                </div>
            </div>
        </form>
    );
};

export default EditVacancy;
