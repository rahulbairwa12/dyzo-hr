import React, { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useSelector } from "react-redux";
import { fetchGET } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const TransactionTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
  });
  const userInfo = useSelector((state) => state.auth.user);
  const companyId = userInfo?.companyId;

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!companyId) return;
      
      setLoading(true);
      try {
        const response = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/api/company/subscription/transactions/?company_id=${companyId}`);
        
        if (response) {
          setTransactions(response.transactions || []);
          setSummary(response.summary || null);
        } else {
          toast.error("Failed to fetch transaction data");
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Error loading transaction history");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [companyId]);

  // Format date to readable string
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency amount
  const formatAmount = (amount, currency = "INR") => {
    const currencySymbol = currency === "INR" ? "₹" : "$";
    return `${currencySymbol}${parseFloat(amount).toFixed(2)}`;
  };

  // Get transaction type badge color
  const getTransactionTypeColor = (type) => {
    switch (type) {
      case "new":
        return "bg-green-100 text-green-800";
      case "renewal":
        return "bg-blue-100 text-blue-800";
      case "modification":
        return "bg-purple-100 text-purple-800";
      case "cancellation":
        return "bg-red-100 text-red-800";
      case "refund":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter transactions based on current filters
  const filteredTransactions = transactions.filter(transaction => {
    // Filter out cancellation transactions
    if (transaction.transaction_type === "cancellation") {
      return false;
    }
    
    // Filter out authorized payment status
    if (transaction.payment_status === "authorized") {
      return false;
    }
    
    if (filters.type !== "all" && transaction.transaction_type !== filters.type) {
      return false;
    }
    if (filters.status !== "all" && transaction.payment_status !== filters.status) {
      return false;
    }
    return true;
  });

  // Remove duplicate payment IDs - keep only the first occurrence
  const uniqueTransactions = filteredTransactions.reduce((acc, current) => {
    // Only include transactions that have both a plan and payment method
    if (!current.subscription_plan || !current.payment_method) {
      return acc;
    }
    
    // If transaction has no payment ID, always include it
    if (!current.razorpay_payment_id) {
      return [...acc, current];
    }
    
    // Check if we already have a transaction with this payment ID
    const exists = acc.find(item => 
      item.razorpay_payment_id && item.razorpay_payment_id === current.razorpay_payment_id
    );
    
    // If it doesn't exist, add it to the accumulator
    if (!exists) {
      return [...acc, current];
    }
    
    // Otherwise, skip this duplicate
    return acc;
  }, []);

  // Sort by ID (lowest first) to ensure we get the first transaction
  uniqueTransactions.sort((a, b) => {
    // Sort by ID (ascending)
    return parseInt(a.id) - parseInt(b.id);
  });

  // Recalculate summary based on uniqueTransactions
  useEffect(() => {
    if (uniqueTransactions.length > 0) {
      // Calculate total amount from unique transactions
      const totalAmount = uniqueTransactions.reduce((sum, transaction) => {
        return sum + parseFloat(transaction.amount || 0);
      }, 0);
      
      // Count transaction types
      const transactionTypes = uniqueTransactions.reduce((types, transaction) => {
        const type = transaction.transaction_type || 'unknown';
        return {
          ...types,
          [type]: (types[type] || 0) + 1
        };
      }, {
        new: 0,
        renewal: 0,
        modification: 0,
        cancellation: 0,
        refund: 0
      });
      
      // Update summary
      setSummary({
        total_transactions: uniqueTransactions.length,
        total_amount: totalAmount,
        transaction_types: transactionTypes
      });
    }
  }, [uniqueTransactions]);

  // Get payment status badge color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "captured":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get payment status display text (modify to show "Successful Payment" for captured)
  const getPaymentStatusDisplay = (status, originalDisplay) => {
    if (status === "captured") {
      return "Successful Payment";
    }
    return originalDisplay;
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Subscription Transaction History</h2>

        {loading ? (
          <div className="space-y-4">
            <Skeleton height={100} className="mb-4" />
            <Skeleton height={50} count={5} className="mb-2" />
          </div>
        ) : (
          <>
            {/* Summary Section */}
            {summary && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Transactions</p>
                        <p className="text-xl font-bold">{summary.total_transactions}</p>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Icon icon="heroicons-outline:document-text" className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-xl font-bold">{formatAmount(summary.total_amount)}</p>
                      </div>
                      <div className="p-2 bg-green-100 rounded-full">
                        <Icon icon="heroicons-outline:currency-rupee" className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                 
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Type:</span>
                <select 
                  className="border border-gray-300 rounded-md py-1 px-2 text-sm"
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="new">New</option>
                  <option value="renewal">Renewal</option>
                  <option value="modification">Modification</option>
                  <option value="refund">Refund</option>
                </select>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Status:</span>
                <select 
                  className="border border-gray-300 rounded-md py-1 px-2 text-sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="captured">Successful Payment</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            {uniqueTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uniqueTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(transaction.created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                            {transaction.transaction_type_display}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-[150px] truncate" title={transaction.subscription_plan}>
                            {transaction.subscription_plan}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatAmount(transaction.amount, transaction.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(transaction.payment_status)}`}>
                            {getPaymentStatusDisplay(transaction.payment_status, transaction.payment_status_display)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {transaction.payment_method || "N/A"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="mx-auto h-16 w-16 mb-4 flex items-center justify-center rounded-full bg-gray-100">
                  <Icon icon="heroicons-outline:document-search" className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
                <p className="text-gray-500 mt-1">
                  {uniqueTransactions.length === 0 && transactions.length > 0 
                    ? "Try adjusting your filters to see more results."
                    : "Your subscription transaction history will appear here."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default TransactionTable; 
