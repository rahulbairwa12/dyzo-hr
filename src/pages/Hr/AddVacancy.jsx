import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Textinput from '@/components/ui/Textinput';
import Select from '@/components/ui/Select';
import { fetchPOST } from '@/store/api/apiSlice';
import { toast } from 'react-toastify';
import TextEditor from '@/components/ui/TextEditor';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Calculate one week from the current date
const addOneWeek = (date) => {
    const result = new Date(date);
    result.setDate(result.getDate() + 7);
    return result;
};

const DateInput = ({ label, name, register, error }) => (
    <div className={`formGroup ${error ? "has-error" : ""}`}>
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
            />
            {error && (
                <div className={`mt-2 ${error ? "text-danger-500 block text-sm" : ""}`}>
                    {error.message}
                </div>
            )}
        </div>
    </div>
);

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

function AddVacancy() {
    const companyId = useSelector((state) => state.auth.user.companyId);
    const { register, handleSubmit, formState: { errors }, setValue, getValues } = useForm({
        resolver: yupResolver(schema),
    });
    const navigate = useNavigate();
    const [isActive, setIsActive] = useState(true);  // Default isActive to true

    useEffect(() => {
        const currentDate = new Date();
        const endDate = addOneWeek(currentDate);

        setValue('start_date', formatDate(currentDate));
        setValue('end_date', formatDate(endDate));
        setValue('is_active', true);
    }, [setValue]);

    const handleAddVacancy = async (data) => {
        const formattedData = {
            ...data,
            start_date: formatDate(data.start_date),
            end_date: formatDate(data.end_date),
            is_active: isActive,
            companyId: companyId,
        };

        try {
            const response = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/api/create-job-vacancies/`, {
                body: JSON.stringify(formattedData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 1) {
                toast.success('Vacancy created successfully');
                navigate('/vacancies-list');
            } else {
                toast.error(`${response.message || 'Failed to add vacancy'}`);
            }
        } catch (error) {
            toast.error('Error while adding vacancy');
            console.error('Error adding vacancy:', error);
        }
    };

    return (
        <>
            <div className="flex flex-row items-center gap-2 mb-4">
                <Icon icon="gg:arrow-left-o" className='w-8 h-8 cursor-pointer' onClick={() => navigate(-1)} />
                <p className="text-black font-semibold text-f20"> Add Vacancy</p>
            </div>
            <form onSubmit={handleSubmit(handleAddVacancy)}>
                <div className="grid grid-cols-1 gap-4">
                    <Textinput
                        name="job_title"
                        label="Job Title"
                        register={register}
                        error={errors?.job_title}
                        placeholder="Enter job title"
                        className="w-full"
                    />

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
                        className="w-full"
                    />

                    <div className="mb-5 relative w-full">
                        <label htmlFor="job_description">Job Description</label>
                        <TextEditor
                            id="job_description"
                            onChange={(content) => setValue('job_description', content)}
                            value={getValues('job_description')}
                            classes="border border-inherit rounded-sm mt-2 dark:text-black-500"
                        />
                        {errors.job_description && <p className="text-red-500 text-sm">{errors.job_description.message}</p>}
                    </div>

                    <div className="mb-5 relative w-full">
                        <label htmlFor="job_role">About This Role</label>
                        <TextEditor
                            id="job_role"
                            onChange={(content) => setValue('job_role', content)}
                            value={getValues('job_role')}
                            classes="border border-inherit rounded-sm mt-2 dark:text-black-500"
                        />
                        {errors.job_role && <p className="text-red-500 text-sm">{errors.job_role.message}</p>}
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
                        <button type="submit" className="btn btn-dark text-center dark:border-2 dark:border-white">Add Vacancy</button>
                    </div>
                </div>
            </form>
        </>
    );
}

export default AddVacancy;
