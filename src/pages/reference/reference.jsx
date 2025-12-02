import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy } from 'react-table';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import SkeletonTable from '@/components/skeleton/Table';
import AdvancedModal from '@/components/ui/AdvancedModal';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Textinput from '@/components/ui/Textinput';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { postAPI, postAPIFiles, fetchDelete } from '@/store/api/apiSlice';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button'; 
import { formatDate } from '@/helper/helper'; 
import DeleteClientPopUp from "@/components/client/DeleteClientPopUp";

const DateInput = ({ label, name, register, error, placeholder }) => (
    <div className={`formGroup ${error ? "has-error" : ""}`}>
        {label && (
            <label htmlFor={name} className="block capitalize form-label">
                {label}
            </label>
        )}
        <div className="relative">
            <input
                type="date"
                name={name}
                {...register(name)}
                placeholder={placeholder}
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

const FileInput = ({ label, name, register, error }) => (
    <div className={`formGroup ${error ? "has-error" : ""}`}>
        {label && (
            <label htmlFor={name} className="block capitalize form-label">
                {label}
            </label>
        )}
        <div className="relative">
            <input
                type="file"
                name={name}
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

const referenceSchema = yup.object({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email format').required('Email is required'),
    location: yup.string().required('Current Location is required'),
    job_experience: yup.string().required('Job Experience is required').matches(/^[0-9]+$/, 'Job Experience must be only digits'),
    position_desired: yup.string().required('Position desired is required'),
    phone_number: yup.string().required('Phone Number is required').matches(/^[0-9]+$/, 'Phone number must be only digits').min(10, 'Phone number must be 10 digits').max(10, 'Phone number must be 10 digits'),
    education_level: yup.string().required('Education Level is required'),
    availability_date: yup.date().transform((value, originalValue) => (originalValue === '' ? null : value)).nullable().required('Availability Date is required'),
}).required()

const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const Reference = () => {
    const [attachedFileName, setAttachedFileName] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false); // Delete modal state
    const [selectedReferenceId, setSelectedReferenceId] = useState(null); // Selected reference ID state
    const [buttonLoading, setButtonLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false); // Loading state for delete action

    const baseURL = import.meta.env.VITE_APP_DJANGO;
    const companyId = useSelector((state) => state?.auth?.user?.companyId);
    const userId = useSelector((state) => state?.auth?.user?._id);
    const [isFileAttachedError, setIsFileAttachedError] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${baseURL}/api/company/${companyId}/references/`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            setData(Array.isArray(result.data) ? result.data : []);
        } catch (error) {
            console.error("Error fetching data:", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [companyId]);

    const referenceColumns = useMemo(() => [
        {
            Header: "S.N.",
            accessor: (_, rowIndex) => rowIndex + 1,
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Name",
            accessor: "name",
        },
        {
            Header: "Email",
            accessor: "email",
        },
        {
            Header: "Reference By",
            accessor: "employee_name",
        },
        {
            Header: "CV",
            accessor: "cv_upload",
            Cell: ({ cell: { value } }) => (
                <a href={`${baseURL}${value}`} target="_blank" rel="noopener noreferrer" className='cursor-pointer text-blue-500'>
                    View CV
                </a>
            ),
        },
        {
            Header: "Status",
            accessor: "status",
        },
        {
            Header: "Detail",
            accessor: "referenceId",
            Cell: ({ cell: { value } }) => (
                <div className="flex items-center space-x-2">
                    <Link to={`/reference/${value}`}>
                        <Icon icon="mdi:eye" className='text-blue-500 w-5 h-5 ' />
                    </Link>
                    <Icon
                        icon="mdi:trash-can"
                        className='text-red-500 w-5 h-5 cursor-pointer'
                        onClick={() => openDeleteModal(value)} // Open delete modal
                    />
                </div>
            ),
        },
    ], [baseURL]);

    const openDeleteModal = (referenceId) => {
        setSelectedReferenceId(referenceId);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            setDeleteLoading(true);
            const response = await fetchDelete(`${baseURL}/api/references/${selectedReferenceId}/delete/`);

            if (response.status) {
                toast.success('Reference deleted successfully.');
                fetchData();
                setDeleteModalOpen(false); // Close modal on success
            } else {
                toast.error(`Failed to delete reference: ${response.message}`);
            }
        } catch (error) {
            toast.error('An error occurred while deleting the reference.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const tableData = useMemo(() => data, [data]);
    const [file, setfile] = useState(null)
    const tableInstance = useTable(
        {
            columns: referenceColumns,
            data: tableData,
        },
        useSortBy
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = tableInstance;

    const {
        register,
        control,
        reset,
        formState: { errors },
        handleSubmit,
    } = useForm({
        resolver: yupResolver(referenceSchema),
        mode: "all",
    });

    const handleAddReference = async (formData) => {
        try {
            setButtonLoading(true);

            const formDataObj = new FormData();
            formDataObj.append('name', formData.name);
            formDataObj.append('email', formData.email);
            formDataObj.append('location', formData.location);
            formDataObj.append('job_experience', formData.job_experience);
            formDataObj.append('phone_number', formData.phone_number);
            formDataObj.append('how_find_job', formData.how_find_job);
            formDataObj.append('position_desired', formData.position_desired);
            formDataObj.append('salary_expectation', formData.salary_expectation);
            formDataObj.append('education_level', formData.education_level);
            formDataObj.append('skills', formData.skills);
            formDataObj.append('status', 'Pending');
            formDataObj.append('availability_date', formatDate(formData.availability_date));

            if (attachedFileName) {
                formDataObj.append('cv_upload', attachedFileName);
            }

            formDataObj.append('company', companyId);
            formDataObj.append('userId', userId);

            const result = await postAPIFiles('api/references/', { body: formDataObj });
            if (result instanceof Error) {
                throw result;
            }

            toast.success('Reference added successfully');
            fetchData();
            setIsModalOpen(false);
            reset();
            setAttachedFileName(null);
            setIsFileAttachedError(false);
        } catch (error) {
            toast.error('An error occurred while adding the reference');
            setIsFileAttachedError(true);
        } finally {
            setButtonLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <div className='flex justify-between'>
                <div className="text-black flex rounded-2 items-center gap-2 pb-6 pt-6">
                    <Icon icon="heroicons-outline:document-text" className='w-6 h-6' />
                    <p className="text-black font-bold text-lg flex items-center">References</p>
                </div>

                <div className="mt-2 mb-4">
                    <Button className="btn btn-dark text-center dark:border-2 dark:border-white" onClick={() => setIsModalOpen(true)}>
                        Add Reference
                    </Button>
                </div>

            </div>

            {
                data.length === 0 ? (<p className='text-center capitalize'>No Data Found</p>) : (
                    <div className="overflow-x-auto mb-20 border rounded-md bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        {loading ? (
                            <SkeletonTable count={5} />
                        ) : (
                            <table
                                className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                                {...getTableProps()}
                            >
                                <thead className="bg-gray-200 dark:bg-gray-700">
                                    {headerGroups.map((headerGroup) => (
                                        <tr {...headerGroup.getHeaderGroupProps()}>
                                            {headerGroup.headers.map((column) => (
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
                                                    {...column.getHeaderProps(column.getSortByToggleProps())}
                                                >
                                                    {column.render("Header")}
                                                    <span>
                                                        {column.isSorted
                                                            ? column.isSortedDesc
                                                                ? " 🔽"
                                                                : " 🔼"
                                                            : ""}
                                                    </span>
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody
                                    className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                                    {...getTableBodyProps()}
                                >
                                    {rows.map((row) => {
                                        prepareRow(row);
                                        return (
                                            <tr {...row.getRowProps()}>
                                                {row.cells.map((cell) => (
                                                    <td
                                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"
                                                        {...cell.getCellProps()}
                                                    >
                                                        {cell.render("Cell")}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )
            }

            <AdvancedModal
                activeModal={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add Reference"
            >
                <form onSubmit={handleSubmit(handleAddReference)}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Textinput
                            name="name"
                            label="Employee Name"
                            register={register}
                            error={errors?.name}
                            placeholder="Enter employee name"
                        />
                        <Textinput
                            name="email"
                            label="Employee Email"
                            register={register}
                            error={errors?.email}
                            placeholder="Enter employee email"
                        />
                        <Textinput
                            name="location"
                            label="Current Location"
                            register={register}
                            error={errors?.location}
                            placeholder="Enter current location"
                        />
                        <Textinput
                            name="job_experience"
                            label="Job Experience"
                            register={register}
                            error={errors?.job_experience}
                            placeholder="Enter job experience"
                        />
                        <Textinput
                            name="position_desired"
                            label="Applying For"
                            register={register}
                            error={errors?.position_desired}
                            placeholder="Enter position desired"
                        />
                        <Textinput
                            name="phone_number"
                            label="Phone Number"
                            register={register}
                            error={errors?.phone_number}
                            placeholder="Enter phone number"
                        />

                        <div className="mb-3">
                            <label htmlFor="formFile" className="mb-2 inline-block text-[#747474] dark:text-gray-300">Attach File</label>
                            <div className="flex items-center">
                                <input
                                    type="file"
                                    id="formFile"
                                    name="cv_upload"
                                    className="relative m-0 block w-full min-w-0 flex-auto rounded border border-solid border-neutral-300 dark:border-neutral-600 bg-clip-padding px-3 py-[0.32rem] text-base font-normal text-neutral-700 dark:text-neutral-200 transition duration-300 ease-in-out file:-mx-3 file:-my-[0.32rem] file:overflow-hidden file:rounded-none file:border-0 file:border-solid file:border-inherit file:bg-neutral-100 dark:file:bg-neutral-700 file:px-3 file:py-[0.32rem] file:text-neutral-700 dark:file:text-neutral-100 file:transition file:duration-150 file:ease-in-out file:[border-inline-end-width:1px] file:[margin-inline-end:0.75rem] hover:file:bg-neutral-200 dark:hover:file:bg-neutral-600 focus:border-primary focus:text-neutral-700 dark:focus:text-neutral-200 focus:shadow-te-primary focus:outline-none"
                                    onChange={(e) => setAttachedFileName(e.target.files[0])}
                                />
                            </div>
                            {isFileAttachedError && <p className="text-red-500">Please attach file</p>}
                        </div>

                        <Textinput
                            name="education_level"
                            label="Educational Background"
                            register={register}
                            error={errors?.education_level}
                            placeholder="Enter educational background"
                        />

                        <Textinput
                            name="salary_expectation"
                            label="Salary Expectation"
                            register={register}
                            error={errors?.salary_expectation}
                            placeholder="Enter salary expectation"
                        />

                        <DateInput
                            name="availability_date"
                            label="Availability Date"
                            register={register}
                            error={errors?.availability_date}
                        />
                    </div>

                    <Textarea
                        name="skills"
                        label="Skills"
                        register={register}
                        error={errors?.skills}
                        placeholder="Enter skills"
                    />

                    <div className="flex justify-end mt-4">
                        <button type="submit" className="btn btn-dark" disabled={buttonLoading}>
                            {buttonLoading ? 'Adding...' : 'Add Reference'}
                        </button>
                    </div>
                </form>
            </AdvancedModal>

            {/* Delete confirmation modal */}
            <DeleteClientPopUp
                showModal={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                handleDelete={handleDelete}
                loading={deleteLoading}
            />
        </div>
    );
};

export default Reference;
