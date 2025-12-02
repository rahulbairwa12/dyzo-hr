import React, { useState, useEffect, useMemo } from 'react';
import Button from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import Icons from '@/components/ui/Icon';
import { useTable, useSortBy } from 'react-table';
import SkeletionTable from '@/components/skeleton/Table';
import { useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import AdvancedModal from '@/components/ui/AdvancedModal';
import { useForm } from 'react-hook-form';
import { getAuthToken } from '@/utils/authToken';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Textinput from '@/components/ui/Textinput';
import Textarea from '@/components/ui/Textarea';
import { postAPI } from '@/store/api/apiSlice';
import { toast } from 'react-toastify';

const Complain = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddComplaintModalOpen, setIsAddComplaintModalOpen] = useState(false);
    const baseURL = import.meta.env.VITE_APP_DJANGO;
    const companyId = useSelector((state) => state?.auth?.user?.companyId);

    // Fetch complaints data
    const fetchData = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            const response = await fetch(`${baseURL}/api/complaints/company/${companyId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
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
    }, []);

    // Define table columns for complaints
    const complainColumns = useMemo(() => [
        {
            Header: "S.N.",
            accessor: (_, rowIndex) => rowIndex + 1,
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Name",
            accessor: "subject",
        },
        {
            Header: "Description",
            accessor: "description",
        },
        {
            Header: "Status",
            accessor: "status",
        },
        {
            Header: "Date",
            accessor: "created_at",
            Cell: ({ cell: { value } }) => new Date(value).toLocaleString(),
        },
        {
            Header: "View",
            accessor: "id",
            Cell: ({ cell: { value } }) => (
                <Link to={`/complain/${value}`}>
                    <Icon icon="mdi:eye" className='text-blue-500 w-5 h-5' />
                </Link>
            ),
        },
    ], []);

    const tableData = useMemo(() => data, [data]);

    const tableInstance = useTable(
        {
            columns: complainColumns,
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

    // Form validation schema for adding a complaint
    const complainSchema = yup.object({
        subject: yup.string().required('Subject is required'),
        description: yup.string().required('Description is required'),
        image: yup.mixed().required('Image is required'),
    });

    const { register, handleSubmit, formState: { errors }, setValue } = useForm({
        resolver: yupResolver(complainSchema),
    });

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

    const onSubmitComplaint = async (formData) => {
        try {
            setLoading(true);

            // Create a FormData object
            const formDataObject = new FormData();
            formDataObject.append('company', companyId);
            formDataObject.append('subject', formData.subject);
            formDataObject.append('description', formData.description);
            if (formData.image[0]) {
                formDataObject.append('image', formData.image[0]);
            }

            // Send the POST request with FormData
            const response = await fetch(`${baseURL}/api/complaints/create/`, {
                body: formDataObject,
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });

            if (response.status) {
                toast.success('Complaint added successfully');
                setIsAddComplaintModalOpen(false);
                fetchData(); // Refresh the complaints data
            } else {
                toast.error('Failed to add complaint');
            }
        } catch (error) {
            toast.error('Failed to add complaint');
            console.error('Error adding complaint:', error);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <div className='flex justify-between'>
                <div className="text-black flex rounded-2 items-center gap-2 pb-6 pt-6">
                    <Icon icon="heroicons:arrow-path-rounded-square" />
                    <p className="text-black font-bold text-lg flex items-center">Complain</p>
                </div>

                <div className="mt-2 mb-4">
                    <Button className="btn btn-dark text-center dark:border-2 dark:border-white" onClick={() => setIsAddComplaintModalOpen(true)}>
                        Add Complaint
                    </Button>
                </div>
            </div>
            <div className=" overflow-x-auto mb-20 border rounded-md bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {loading ? (
                    <SkeletionTable count={5} />
                ) : (
                    <table
                        className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                        {...getTableProps()}
                    >
                        <thead className="bg-slate-200 dark:bg-slate-700">
                            {headerGroups.map((headerGroup) => (
                                <tr {...headerGroup.getHeaderGroupProps()}>
                                    {headerGroup.headers.map((column) => (
                                        <th
                                            {...column.getHeaderProps(column.getSortByToggleProps())}
                                            className="table-th"
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
                        <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {rows.map((row) => {
                                prepareRow(row);
                                return (
                                    <tr {...row.getRowProps()}>
                                        {row.cells.map((cell) => (
                                            <td {...cell.getCellProps()} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
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

            <AdvancedModal
                activeModal={isAddComplaintModalOpen}
                onClose={() => setIsAddComplaintModalOpen(false)}
                className="max-w-xl"
                title="Add Complaint"
            >
                <form onSubmit={handleSubmit(onSubmitComplaint)} className="space-y-4">
                    <Textinput
                        label="Subject"
                        name="subject"
                        register={register}
                        placeholder="Enter subject"
                        error={errors.subject?.message}
                    />
                    <Textarea
                        label="Description"
                        name="description"
                        register={register}
                        placeholder="Enter description"
                        error={errors.description?.message}
                    />
                    <input
                        type="file"
                        {...register('image')}
                        className="form-input"
                    />
                    {errors.image && <p className="text-red-500">{errors.image.message}</p>}

                    <div className="text-left">
                        <Button type="submit" className="btn btn-dark text-center dark:border-2 dark:border-white">
                            {loading ? 'Adding...' : 'Submit Complaint'}
                        </Button>
                        <Button onClick={() => setIsAddComplaintModalOpen(false)} className="btn btn-light text-center ml-4">
                            Close
                        </Button>
                    </div>
                </form>
            </AdvancedModal>
        </div>
    );
};

export default Complain;
