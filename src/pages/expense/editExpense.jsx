import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Textarea from '@/components/ui/Textarea';
import { getAuthToken } from '@/utils/authToken';
import Select from '@/components/ui/Select';
import { fetchAPI, patchUpdateAPI } from '@/store/api/apiSlice';

const EditExpense = () => {
    const [loading, setLoading] = useState(false);
    const [allVendors, setAllVendors] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [expenseData, setExpenseData] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const companyId = useSelector((state) => state?.auth?.user?.companyId);
    const navigate = useNavigate();
    const { expenseId } = useParams();

    // Validation schema - all fields optional
    const FormValidationSchema = yup.object({
        vendor: yup.number().nullable(),
        amount: yup.number().nullable(),
        account: yup.number().nullable(),
        description: yup.string().nullable(),
        title: yup.string().nullable(),
        receipt: yup.mixed().nullable(),
    });

    const { register, handleSubmit, formState: { errors }, setValue } = useForm({
        resolver: yupResolver(FormValidationSchema),
        defaultValues: {
            vendor: '',
            account: '',
            amount: '',
            description: '',
            title: '',
        },
    });

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const vendorResponse = await fetchAPI(`employee/list/activeUsers/${companyId}/`);
                if (vendorResponse.status) {
                    const vendorOptions = vendorResponse.data.map(vendor => ({
                        value: vendor._id.toString(),
                        label: vendor.name || `${vendor.firstName} ${vendor.lastName}`,
                    }));
                    setAllVendors(vendorOptions);
                } else {
                    toast.error('Failed to fetch vendors');
                }
            } catch (error) {
                toast.error('Failed to fetch vendors');
                console.error('Error fetching vendors:', error);
            }
        };

        const fetchAccounts = async () => {
            try {
                const accountResponse = await fetchAPI(`api/company_accounts/${companyId}/`);
                if (accountResponse.status) {
                    const accountOptions = accountResponse.data.map(account => ({
                        value: account.id.toString(),
                        label: account.account,
                    }));
                    setAllAccounts(accountOptions);
                } else {
                    toast.error('Failed to fetch accounts');
                }
            } catch (error) {
                toast.error('Failed to fetch accounts');
                console.error('Error fetching accounts:', error);
            }
        };

        const fetchExpenseData = async () => {
            try {
                const expenseResponse = await fetchAPI(`api/company-expense/${companyId}/${expenseId}/`);
                if (expenseResponse.status) {
                    const expense = expenseResponse.data;
                    setExpenseData(expense);
                    setValue('vendor', expense.vendor.toString());
                    setValue('account', expense.company_account.toString());
                    setValue('amount', expense.amount);
                    setValue('description', expense.description);
                    setValue('title', expense.title);
                } else {
                    toast.error('Failed to fetch expense data');
                }
            } catch (error) {
                toast.error('Failed to fetch expense data');
                console.error('Error fetching expense data:', error);
            }
        };

        fetchVendors();
        fetchAccounts();
        fetchExpenseData();
    }, [companyId, expenseId, setValue]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
        console.log("selectedFile", selectedFile);
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const formData = new FormData();

            // Append all fields as strings
            formData.append('company', companyId.toString());
            formData.append('amount', data.amount ? data.amount.toString() : '');
            formData.append('description', data.description || '');
            formData.append('vendor', data.vendor ? data.vendor.toString() : '');
            formData.append('company_account', data.account ? data.account.toString() : '');
            formData.append('title', data.title || '');

            // Handle file upload
            if (selectedFile) {
                formData.append('receipt', selectedFile);
            }

            const expenseResponse = await fetch(`${import.meta.env.VITE_APP_DJANGO}/api/company-expense/update/${companyId}/${expenseId}/`, {
                method: 'PATCH',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            }).then(res => res.json());

            if (expenseResponse.status) {
                toast.success(expenseResponse.message);
                setTimeout(() => {
                    navigate('/expense');
                    setLoading(false);
                }, 800);
            } else {
                toast.error('Expense not updated, Please try again!');
                setLoading(false);
            }
        } catch (error) {
            toast.error('Failed to update expense');
            console.error('Error:', error);
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 800);
        }
    };

    if (!expenseData) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" encType="multipart/form-data">
                <Textinput
                    type="text"
                    label="Title"
                    name="title"
                    register={register}
                    placeholder="Enter expense title"
                />

                <Select
                    label="Vendor"
                    name="vendor"
                    register={register}
                    placeholder="Select vendor"
                    options={allVendors}
                />

                <Textinput
                    type="number"
                    label="Amount"
                    name="amount"
                    register={register}
                    placeholder="Enter amount"
                />

                <Select
                    label="Account"
                    name="account"
                    register={register}
                    placeholder="Select account"
                    options={allAccounts}
                />

                <Textarea
                    label="Description"
                    name="description"
                    register={register}
                    placeholder="Enter expense description"
                />

                <div className="flex items-center space-x-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Receipt
                    </label>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary-50 file:text-primary-700
                            hover:file:bg-primary-100"
                    />
                </div>

                <div className="text-left">
                    <Button type="submit" className="btn btn-dark text-center dark:border-2 dark:border-white">
                        {loading ? 'Saving...' : 'Save Expense'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditExpense;
