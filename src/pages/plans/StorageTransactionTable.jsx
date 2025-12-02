import { fetchAuthPost } from '@/store/api/apiSlice';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { formatDate } from '@/helper/helper';
import SkeletionTable from '@/components/skeleton/Table';
import TransactionTable from './TransactionTable';
import DatePickerStartAndEndDate from '@/components/userProfile/DatePickerStartAndEndDate';

const StorageTransactionTable = () => {
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const userInfo = useSelector((state) => state.auth.user);
    const [storageHistory, setStorageHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(formatDate(oneYearAgo));
    const [endDate, setEndDate] = useState(formatDate(today));

    const handleDateRangeChange = (dates) => {
        const [start, end] = dates;
        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
    };

    useEffect(() => {
        const fetchStorageHistory = async () => {
            try {
                setLoading(true);
                const { data } = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/api/storage-payments/${userInfo?.companyId}/`, {
                    body: {
                        company_id: userInfo?.companyId,
                        start_date: startDate,
                        end_date: endDate
                    }
                });

                if (data) setStorageHistory(data);
            } catch (error) {
                toast.error("Failed to fetch storage history");
            } finally {
                setLoading(false);
            }
        };

        fetchStorageHistory();
    }, [userInfo?.companyId, startDate, endDate]);

    return (
        <div>
            <div className='my-3 flex justify-end'>
                <DatePickerStartAndEndDate
                    initialStartDate={startDate}
                    initialEndDate={endDate}
                    onRangeChange={handleDateRangeChange}
                />
            </div>

            {loading && <SkeletionTable count='20' />}

            {!loading && (
                (storageHistory.length === 0) ? (
                    <p className='text-center capitalize'>No Transaction history</p>
                ) : (
                    <TransactionTable storageHistory={storageHistory} />
                )
            )}
        </div>
    );
};

export default StorageTransactionTable;