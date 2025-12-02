import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { fetchAPI } from '@/store/api/apiSlice';

function ExpenseDetails() {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const companyId = useSelector((state) => state?.auth?.user?.companyId);
  const [expenseDetails, setExpenseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatUtcToLocal = (utcDateString) => {
    const date = new Date(utcDateString);
    const options = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    return formatter.format(date);
  }

  useEffect(() => {
    const fetchExpenseDetails = async () => {
      try {
        if (!companyId || !expenseId) {
          throw new Error('Missing companyId or expenseId');
        }
        
        const response = await fetchAPI(`api/company-expense/${companyId}/${expenseId}/`);
        if (response.status) {
          setExpenseDetails(response);
        } else {
          throw new Error('Failed to fetch expense details');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching expense details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseDetails();
  }, [companyId, expenseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-danger-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Icon icon="heroicons-outline:document-text" className="w-6 h-6 text-primary-500" />
            <h3 className="text-xl font-semibold">Expense Details</h3>
          </div>
          <Button
            onClick={() => navigate('/expense')}
            className="btn btn-light"
          >
            <Icon icon="heroicons-outline:arrow-left" className="w-5 h-5 mr-2" />
            Back to Expenses
          </Button>
        </div>
      </div>

      <div className="card-body">
        {expenseDetails ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Title</h4>
                <p className="text-base font-medium">{expenseDetails.data.title}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Amount</h4>
                <p className="text-base font-medium">₹{expenseDetails.data.amount}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Vendor</h4>
                <p className="text-base font-medium">{expenseDetails.data.vendor_name}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Account</h4>
                <p className="text-base font-medium">{expenseDetails.data.account}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Status</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  expenseDetails.data.status === 'approved' 
                    ? 'bg-success-100 text-success-800' 
                    : expenseDetails.data.status === 'rejected'
                    ? 'bg-danger-100 text-danger-800'
                    : 'bg-warning-100 text-warning-800'
                }`}>
                  {expenseDetails.data.status.charAt(0).toUpperCase() + expenseDetails.data.status.slice(1)}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Date Added</h4>
                <p className="text-base font-medium">{formatUtcToLocal(expenseDetails.data.dateAdded)}</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Description</h4>
              <p className="text-base">{expenseDetails.data.description || 'No description provided'}</p>
            </div>

            {expenseDetails.data.receipt && (
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Receipt</h4>
                <a 
                  href={`${import.meta.env.VITE_APP_DJANGO}${expenseDetails.data.receipt}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-600 flex items-center gap-2"
                >
                  <Icon icon="heroicons-outline:document" className="w-5 h-5" />
                  View Receipt
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon icon="heroicons-outline:exclamation-circle" className="w-12 h-12 mx-auto text-slate-400" />
            <p className="mt-4 text-slate-500">No expense details found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpenseDetails;
