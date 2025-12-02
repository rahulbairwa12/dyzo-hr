import React, { useEffect, useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useTable, useRowSelect, useSortBy, useGlobalFilter, usePagination } from "react-table";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchAuthGET, fetchDelete } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";
import GlobalFilter from "../leaves/GlobalFilter";
import Select from 'react-select';
import SkeletionTable from "@/components/skeleton/Table";
import PaymentForm from "./PaymentForm";

const getMonthOptions = () => {
  return [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
};

const getYearOptions = (startYear, endYear) => {
  let years = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
};

const SalaryTable = () => {
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryData, setSalaryData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(5, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const userInfo = useSelector((state) => state.auth.user);
  const baseURL = import.meta.env.VITE_APP_DJANGO;
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryAmountPay, setSalaryAmountToPaid] = useState(0);
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const yearOptions = useMemo(() => getYearOptions(2000, new Date().getFullYear()), []);
  const [paymentStatus, setPaymentStatus] = useState({});
  const [paymentNewData, setPaymentNewData] = useState({});

  const COLUMNS = [
    {
      Header: "SN",
      Cell: (row) => <div>{parseInt(row.row.index, 10) + 1}</div>,
    },
    {
      Header: "Name",
      accessor: "name",
    },
    {
      Header: "Monthly Pay",
      accessor: "salary",
    },
    {
      Header: "Estimated Salary",
      accessor: "estimation_salary",
    },
    {
      Header: "Unpaid Leaves",
      accessor: "Unpaid_Leave",
    },
    {
      Header: "Salary to be paid",
      accessor: "bonus",
    },
    {
      Header: "Payment Status",
      accessor: "payment_status",
      Cell: (row) => {
        const isPaid = paymentStatus[row.row.original._id]?.isPaid;
        return (
          <span className={isPaid ? "text-green-500" : "text-red-500"}>
            {isPaid ? "Paid" : "Due"}
          </span>
        );
      },
    },
    {
      Header: "Actions",
      Cell: (row) => {
        const isPaid = paymentStatus[row.row.original._id]?.isPaid;
        const handleUndo = () => {
          if (isPaid) {
            undoPayment(paymentStatus[row.row.original._id]?.paymentId);
          }
        };

        return (
          <div>
            {isPaid ? (
              <span
                className="text-red-500 cursor-pointer"
                onClick={handleUndo}
              >
                Undo
              </span>
            ) : (
              <span
                className={`text-blue-500 cursor-pointer ${isPaid ? "text-gray-500 cursor-not-allowed" : ""}`}
                onClick={() => {
                  if (!isPaid) {
                    setShowSalaryModal(true);
                    setSelectedEmployee(row.row.original._id);
                    setSalaryAmountToPaid(row.row.original.bonus);
                  }
                }}
              >
                {isPaid ? "Paid" : "Pay Now"}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      const response = await fetchAuthGET(`${baseURL}/api/employees/salary/${userInfo?.companyId}/${selectedYear}-${selectedMonth}/`);
      if (response.data) {
        const updatedData = response.data.map((employee) => ({
          ...employee,
          payment_status: paymentStatus[employee._id]?.isPaid ? "Paid" : "Due",
        }));
        setSalaryData(updatedData);
      }
    } catch (error) {
      toast.error('Failed to fetch employees salary data');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchSalaryData();
  }, [selectedMonth, selectedYear, paymentStatus]);

  const getPaymentData = async () => {
    try {
      const paymentData = await fetchAuthGET(`${baseURL}/api/salary-payments/${userInfo?.companyId}/${selectedYear}-${selectedMonth}/`);
      if (paymentData.status) {
        const paymentStatusMap = {};
        paymentData.data.forEach(payment => {
          paymentStatusMap[payment.employee] = { isPaid: payment.is_paid, paymentId: payment.id };
        });
        setPaymentStatus(paymentStatusMap);
        setPaymentNewData(paymentData.data);
      }
    } catch (error) {
      toast.error('Failed to fetch payment data');
    }
  };

  useEffect(() => { getPaymentData(); }, [selectedMonth, selectedYear]);

  const undoPayment = async (paymentId) => {
    setLoading(true);
    try {
      const response = await fetchDelete(`${baseURL}/delete-payment/${paymentId}`);
      if (response.status) {
        toast.success(response.message || 'Payment deleted successfully.');
        getPaymentData();
        fetchSalaryData();

        setPaymentStatus(prev => {
          const updatedStatus = { ...prev };
          delete updatedStatus[paymentId];
          return updatedStatus;
        });
      } else {
        toast.error(response.message || "Failed to delete payment. Try again later.");
      }
    } catch (error) {
      toast.error("Network error or bad response. Please try again later.");
    } finally {
      setLoading(false);
    }
  };


  const columns = useMemo(() => COLUMNS, [paymentStatus]);
  const data = useMemo(() => salaryData, [salaryData]);

  const tableInstance = useTable(
    { columns, data },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect
  );
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,
    state,
    gotoPage,
    pageCount,
    setPageSize,
    setGlobalFilter,
    prepareRow,
  } = tableInstance;

  const { globalFilter, pageIndex, pageSize } = state;

  return (
    <>
      {/* Global filter, month and year selection */}
      <div className="flex flex-col md:flex-row gap-5 items-center justify-between space-x-4 my-4">
        <div className="">
          <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />
        </div>
        <div className="flex space-x-4 items-center">
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Month</label>
            <Select
              options={monthOptions}
              defaultValue={monthOptions.find(option => option.value === selectedMonth)}
              onChange={(option) => setSelectedMonth(option.value)}
              className="dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Year</label>
            <Select
              options={yearOptions}
              defaultValue={yearOptions.find(option => option.value === selectedYear)}
              onChange={(option) => setSelectedYear(option.value)}
              className="dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Table and Pagination */}
      {loading ? (
        <SkeletionTable count='20' />
      ) : salaryData.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xl font-medium text-gray-700 dark:text-gray-300">No employees found</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto -mx-6">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table
                  className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                  {...getTableProps()}
                >
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    {headerGroups.map((headerGroup) => (
                      <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                          <th
                            {...column.getHeaderProps(
                              column.getSortByToggleProps()
                            )}
                            scope="col"
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
                  <tbody
                    className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
                    {...getTableBodyProps()}
                  >
                    {page.map((row) => {
                      prepareRow(row);
                      return (
                        <tr
                          {...row.getRowProps()}
                          className="dark:even:bg-slate-700 "
                        >
                          {row.cells.map((cell) => {
                            return (
                              <td {...cell.getCellProps()} className="table-td">
                                {cell.render("Cell")}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-6 items-center">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <span className="flex space-x-2 rtl:space-x-reverse items-center">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Go
                </span>
                <span>
                  <input
                    type="number"
                    className="form-control py-2"
                    defaultValue={pageIndex + 1}
                    onChange={(e) => {
                      const pageNumber = e.target.value
                        ? Number(e.target.value) - 1
                        : 0;
                      gotoPage(pageNumber);
                    }}
                    style={{ width: "50px" }}
                  />
                </span>
              </span>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Page{" "}
                <span>
                  {pageIndex + 1} of {pageOptions.length}
                </span>
              </span>
            </div>
            <ul className="flex items-center space-x-3 rtl:space-x-reverse">
              <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                <button
                  className={` ${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                >
                  <Icon icon="heroicons-outline:chevron-left" />
                </button>
              </li>
              {/* {pageOptions.map((page, pageIdx) => (
                <li key={pageIdx}>
                  <button
                    aria-current="page"
                    className={` ${pageIdx === pageIndex
                      ? "bg-slate-900 dark:bg-slate-600 dark:text-slate-200 text-white font-medium"
                      : "bg-slate-100 dark:text-slate-400 text-slate-900 font-normal"
                      } text-sm rounded leading-[16px] flex h-6 w-6 items-center justify-center transition-all duration-150`}
                    onClick={() => gotoPage(pageIdx)}
                  >
                    {page + 1}
                  </button>
                </li>
              ))} */}
              <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                <button
                  className={` ${!canNextPage ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                >
                  <Icon icon="heroicons-outline:chevron-right" />
                </button>
              </li>
            </ul>
          </div>
        </Card>
      )}

      {<PaymentForm showSalaryModal={showSalaryModal} setShowSalaryModal={setShowSalaryModal} selectedMonth={selectedMonth} selectedYear={selectedYear} employeeId={selectedEmployee} salaryAmountPay={salaryAmountPay} getPaymentData={getPaymentData}
      />}
    </>
  );
};

export default SalaryTable;


