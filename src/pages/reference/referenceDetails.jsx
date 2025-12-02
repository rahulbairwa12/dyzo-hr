import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Icon } from '@iconify/react';
import AdvancedModal from '@/components/ui/AdvancedModal';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Textinput from '@/components/ui/Textinput';
import Select from '@/components/ui/Select';
import { getAuthToken } from '@/utils/authToken';
import { fetchAuthGET } from '@/store/api/apiSlice';
import { toast } from 'react-toastify';
import { useTable, useSortBy, useGlobalFilter } from 'react-table';
import Card from '@/components/ui/Card';

const TimeInput = ({ label, name, register, error, placeholder }) => (
  <div className={`formGroup ${error ? "has-error" : ""}`}>
    {label && (
      <label htmlFor={name} className="block capitalize form-label">
        {label}
      </label>
    )}
    <div className="relative">
      <input
        type="time"
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

const ReferenceDetails = () => {
  const { referenceId } = useParams();
  const [reference, setReference] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const userInfo = useSelector(state => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState([]);

  const baseURL = import.meta.env.VITE_APP_DJANGO;

  useEffect(() => {
    const fetchReference = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch(`${baseURL}/reference/${referenceId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setReference([result.data]);
      } catch (error) {
        console.error('Error fetching reference data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReference();
  }, [baseURL, referenceId]);

  const getAllEmployees = useCallback(async () => {
    try {
      let data;
      if (userInfo?.isAdmin) {
        data = await fetchAuthGET(`${baseURL}/employee/list/${userInfo?.companyId}`);
      } else if (userInfo?.team_leader) {
        data = await fetchAuthGET(`${baseURL}/api/team/members/${userInfo?._id}`);
      }

      if (data.status && data.data.length > 0) {
        // Filter only active employees
        const employeeOptions = data.data
          .filter(employee => employee.isActive) // Filter for active employees
          .map(employee => ({
            value: employee._id,
            label: employee.name
          }));

        setEmployees(employeeOptions);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [userInfo]);

  useEffect(() => {
    getAllEmployees();
  }, [getAllEmployees]);

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const data = await fetchAuthGET(`${baseURL}/reference-interviews/${referenceId}/`);
        if (data.status) {
          setTableData(data.data);
        }
      } catch (error) {
        console.error('Error fetching table data:', error);
      }
    };

    fetchTableData();
  }, [baseURL, referenceId]);

  const referenceSchema = yup.object({
    attendees1: yup.string().required('Attendee 1 is required'),
    attendees2: yup.string().required('Attendee 2 is required'),
    mode: yup.string().oneOf(['online', 'offline'], 'Invalid interview mode').required('Interview mode is required'),
    meeting_link: yup.string().when('mode', {
      is: 'online',
      then: yup.string().required('Meeting link is required'),
      otherwise: yup.string().nullable(),
    }),
    address: yup.string().when('mode', {
      is: 'offline',
      then: yup.string().required('Address is required'),
      otherwise: yup.string().nullable(),
    }),
    interview_date: yup.date().required('Interview date is required').typeError('Invalid date format'),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(referenceSchema),
    mode: "all",
    defaultValues: {
      mode: 'online',
    },
  });

  const selectedMode = watch('mode');

  const handleAddReference = async (data) => {
    const attendee1Id = data.attendees1;
    const attendee2Id = data.attendees2;

    if (attendee1Id === attendee2Id) {
      toast.error('Attendee 1 and Attendee 2 cannot be the same.');
      return;
    }

    const formatDate = (date) => {
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    const formatTime = (time) => {
      const [hours, minutes] = time.split(':');
      return `${hours}:${minutes}`;
    };

    const payload = {
      mode: data.mode,
      interview_date: formatDate(data.interview_date),
      interview_time: formatTime(data.interview_time),
      meeting_link: data.mode === 'online' ? data.meeting_link : null,
      address: data.mode === 'offline' ? data.address : null,
      attendee1: attendee1Id,
      attendee2: attendee2Id,
      candidate: referenceId,
      company: userInfo?.companyId
    };

    try {
      const formData = new FormData();
      Object.keys(payload).forEach((key) => {
        formData.append(key, payload[key]);
      });

      const response = await fetch(`${baseURL}/create-interview/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setIsModalOpen(false);
        reset();
      } else {
        console.error('Failed to add schedule');
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
    }
  };

  const columns = useMemo(() => [
    {
      Header: "S.N.",
      accessor: (_, rowIndex) => rowIndex + 1,
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Mode",
      accessor: "mode",
    },
    {
      Header: "Attendee 1",
      accessor: "attendee1_name",
    },
    {
      Header: "Attendee 2",
      accessor: "attendee2_name",
    },
    {
      Header: "Attendee 1 Marks",
      accessor: "attendee1_marks",
    },
    {
      Header: "Attendee 2 Marks",
      accessor: "attendee2_marks",
    },
    {
      Header: "Status",
      accessor: "status",
    },
  ], []);

  const data = useMemo(() => tableData, [tableData]);

  const tableInstance = useTable(
    {
      columns,
      data,
    },
    useGlobalFilter,
    useSortBy
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!reference.length) {
    return <div>Reference not found.</div>;
  }

  return (
    <div>
      <div className='flex items-center gap-4'>
        <Icon icon="heroicons-outline:document-text" className='w-6 h-6' />
        <h3 className='text-lg font-semibold'>Reference Interview Details</h3>
      </div>
      <button
        className='btn mt-6 mb-0 btn-dark text-center dark:border-2 dark:border-white'
        onClick={() => setIsModalOpen(true)}
      >
        Schedule Interview
      </button>
      <div className='mt-8'>
        {reference.map((ref) => (
          <div key={ref.id}>
            <div className='mb-2 mt-2'>
              <strong>Name: </strong> {ref.name}
            </div>
            <div className='mb-2 mt-2'>
              <strong>Email: </strong> {ref.email}
            </div>
            <div className='mb-2 mt-2'>
              <strong>Location: </strong> {ref.location}
            </div>
            <div className='mb-2 mt-2'>
              <strong>Job Experience: </strong> {ref.job_experience} Years
            </div>
            <div className='mb-2 mt-2'>
              <strong>Phone Number: </strong> {ref.phone_number}
            </div>
            <div className='mb-2 mt-2'>
              <strong>How Did You Find This Job?: </strong> {ref.how_find_job}
            </div>
            <div className='mb-2 mt-2'>
              <strong>Position Desired: </strong> {ref.position_desired}
            </div>
            <div className='mb-2 mt-2'>
              <strong>Salary Expectation: </strong> {ref.salary_expectation}
            </div>
            <div className='mb-2 mt-2'>
              <strong>Availability Date: </strong> {ref.availability_date}
            </div>
            <div className='mb-2 mt-2'>
              <strong>Skills: </strong> {ref.skills}
            </div>
            <div className='mb-2 mt-2'>
              <strong>Educational Background: </strong> {ref.education_level}
            </div>
            <div className='mb-2 mt-2'>
              <strong>Status: </strong> {ref.status}
            </div>
            <div className='mb-2 mt-2'>
              <strong>Date: </strong> {new Date(ref.dateAdded).toLocaleString()}
            </div>
            {ref.cv_upload && (
              <div className='mb-2 mt-2'>
                <strong>CV: </strong>
                <a href={`${baseURL}${ref.cv_upload}`} target="_blank" rel="noopener noreferrer" className='text-blue-500'>
                  View CV
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
      <AdvancedModal
        activeModal={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Reference"
      >
        <form onSubmit={handleSubmit(handleAddReference)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              name="attendees1"
              label="Attendee 1"
              options={employees}
              register={register}
              error={errors?.attendees1}
            />
            <Select
              name="attendees2"
              label="Attendee 2"
              options={employees}
              register={register}
              error={errors?.attendees2}
            />
            <Select
              name="mode"
              label="Interview Mode"
              options={[
                { value: 'online', label: 'Online' },
                { value: 'offline', label: 'Offline' },
              ]}
              register={register}
              error={errors?.mode}
            />
            {selectedMode === 'online' && (
              <Textinput
                name="meeting_link"
                id="meeting-label"
                label="Meeting Link"
                register={register}
                error={errors?.meeting_link}
                placeholder="Enter meeting link"
              />
            )}

            {selectedMode === 'offline' && (
              <Textinput
                name="address"
                id="address-label"
                label="Address"
                register={register}
                error={errors?.address}
                placeholder="Enter address"
              />
            )}

            <DateInput
              name="interview_date"
              label="Interview Date"
              register={register}
              error={errors?.interview_date}
            />
            <TimeInput
              name="interview_time"
              label="Interview Time"
              register={register}
              error={errors?.interview_time}
            />
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" className="btn btn-dark">Schedule</button>
          </div>
        </form>
      </AdvancedModal>

      <Card className='mt-8'>
        <div className="overflow-x-auto -mx-6 ">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table
                className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                {...getTableProps()}
              >
                <thead className="bg-slate-200 dark:bg-slate-700">
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <th
                          {...column.getHeaderProps(column.getSortByToggleProps())}
                          scope="col"
                          className="table-th px-2 md:px-6 py-3 font-semibold text-gray-900"
                        >
                          <div className="flex">
                            {column.render("Header")}
                            <span>
                              {column.isSorted
                                ? column.isSortedDesc
                                  ? " 🔽"
                                  : " 🔼"
                                : ""}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody
                  className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
                  {...getTableBodyProps()}
                >
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        Loading...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        No data found!
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()} className="cursor-pointer relative">
                          {row.cells.map((cell) => (
                            <td {...cell.getCellProps()} className="table-td px-2 md:px-6 py-3">
                              {cell.render("Cell")}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReferenceDetails;
