import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Textarea from '@/components/ui/Textarea';
import { getAuthToken } from '@/utils/authToken';
import Select from '@/components/ui/Select';
import { postAPI, fetchAPI } from '@/store/api/apiSlice';
import AdvancedModal from '@/components/ui/AdvancedModal';

const AddExpense = () => {
    const [loading, setLoading] = useState(false);
    const [allVendors, setAllVendors] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const companyId = useSelector((state) => state.auth.user.companyId);
    const userId = useSelector((state) => state.auth.user._id);
    const navigate = useNavigate();

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
    });

    const { register: registerAccount, handleSubmit: handleSubmitAccount, formState: { errors: accountErrors }, reset: resetAccountForm } = useForm({
        resolver: yupResolver(yup.object({
            accountName: yup.string().required('Account name is required'),
        })),
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

        fetchVendors();
        fetchAccounts();
    }, [companyId]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const formData = new FormData();

            // Append all fields as strings
            formData.append('company', companyId.toString());
            formData.append('userId', userId.toString());
            formData.append('amount', data.amount ? data.amount.toString() : '');
            formData.append('description', data.description || '');
            formData.append('vendor', data.vendor ? data.vendor.toString() : '');
            formData.append('company_account', data.account ? data.account.toString() : '');
            formData.append('title', data.title || '');

            // Handle file upload
            if (selectedFile) {
                formData.append('receipt', selectedFile);
            }

            const expenseResponse = await fetch(`${import.meta.env.VITE_APP_DJANGO}/api/company-expense/create/`, {
                method: 'POST',
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
                toast.error('Expense not added, Please try again!');
                setLoading(false);
            }
        } catch (error) {
            toast.error('Failed to add expense');
            console.error('Error:', error);
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 800);
        }
    };

    const onAccountSubmit = async (data) => {
        const payload = {
            company: companyId,
            account: data.accountName,
        };

        try {
            const accountResponse = await postAPI('api/company_accounts/create/', {
                body: payload,
            });

            if (accountResponse.status) {
                toast.success('Account added successfully');
                setIsAccountModalOpen(false);
                resetAccountForm();
                setAllAccounts(prev => [...prev, { value: accountResponse.data.id, label: accountResponse.data.account }]);
            } else {
                toast.error('Failed to add account');
            }
        } catch (error) {
            toast.error('Failed to add account');
            console.error('Error adding account:', error);
        }
    };

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
                <span className='cursor-pointer text-blue-400 text-sm p-2' onClick={() => { setIsAccountModalOpen(true) }}> Add Account</span>

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
                        {loading ? 'Adding...' : 'Add Expense'}
                    </Button>
                </div>
            </form>

            <AdvancedModal
                activeModal={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                className="max-w-xl"
                title="Add Account"
            >
                <form onSubmit={handleSubmitAccount(onAccountSubmit)} className="space-y-4">
                    <Textinput
                        label="Account Name"
                        name="accountName"
                        register={registerAccount}
                        placeholder="Enter account name"
                        error={accountErrors.accountName?.message}
                    />

                    <div className="text-left">
                        <Button type="submit" className="btn btn-dark text-center dark:border-2 dark:border-white">
                            Add Account
                        </Button>
                        <Button onClick={() => setIsAccountModalOpen(false)} className="btn btn-light text-center ml-4">
                            Close
                        </Button>
                    </div>
                </form>
            </AdvancedModal>
        </div>
    );
};

export default AddExpense;
