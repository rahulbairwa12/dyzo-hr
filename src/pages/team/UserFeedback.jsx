import React, { useMemo, useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import ListSkeleton from "@/pages/table/ListSkeleton";
import { useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import AdvancedModal from "@/components/ui/AdvancedModal";
import { useForm } from "react-hook-form";
import Textarea from "@/components/ui/Textarea";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import EditFeedBack from "./EditFeedBack";
import { getAuthToken } from "@/utils/authToken";

const UserFeedback = () => {
  const { userId } = useParams();
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [formData, setFormData] = useState({ comment: "" });
  const baseURL = import.meta.env.VITE_APP_DJANGO;
  const userInfo = useSelector((state) => state.auth.user);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFeedbackValue, setEditFeedbackValue] = useState({});

  // Fetch feedbacks data from API
  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${baseURL}/api/feedbacks/${userId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.status) {
        setFeedbacks(data.data);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch feedbacks on component mount
  useEffect(() => {
    fetchFeedbacks();
  }, [userId]);

  // Define table columns
  const columns = useMemo(
    () => [
      {
        Header: "Feedback Giver",
        accessor: "feedback_giver_name",
        Cell: (row) => <span>{row?.cell?.value}</span>,
      },
      {
        Header: "Feedback Receiver",
        accessor: "feedback_receiver_name",
        Cell: (row) => <span>{row?.cell?.value}</span>,
      },
      {
        Header: "Comments",
        accessor: "comments",
        Cell: (row) => {
          const comment = row?.cell?.value;
          return (
            <span>
              {comment.length > 40 ? `${comment.substring(0, 40)}...` : comment}
            </span>
          );
        },
      },
      {
        Header: "Updated At",
        accessor: "updated_at",
        Cell: (row) => {
          const date = new Date(row?.cell?.value);
          return (
            <span>{formatDate(date)}</span>
          );
        },
      },

      {
        Header: "Actions",
        accessor: "actions",
        Cell: (row) => {
          return <span onClick={(event) => { event.stopPropagation(); setIsEditModalOpen(true); setEditFeedbackValue(row.row.original) }}>
            {userInfo._id === row.row.original.feedback_giver && <Icon icon="heroicons:pencil-square" className='w-6 h-6 cursor-pointer' />}
          </span>

        },
      },
    ],
    []
  );

  // Prepare data for table
  const data = useMemo(() => feedbacks, [feedbacks]);

  // Create table instance
  const tableInstance = useTable(
    {
      columns,
      data,
    },
    useGlobalFilter,
    useSortBy
  );

  // Destructure table instance properties
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

  // Form handling with react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Handle form data change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle add feedback submit
  const handleAddFeedback = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const apiEndpoint = `${baseURL}/feedback/`;
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          comments: formData.comment,
          feedback_giver: userInfo._id,
          feedback_receiver: userId
        }),
      });

      const data = await response.json();

      if (data.status) {
        toast.success('Feedback posted successfully.');
        fetchFeedbacks(); // Refresh feedbacks
        setIsAddModalOpen(false);
      } else {
        toast.error(`Failed to post feedback: ${data.message}`);
      }
    } catch (error) {
      toast.error(`Error: ${error.message || 'An error occurred'}`);
      console.error("Error adding feedback:", error);
    } finally {
      setLoading(false);
      setFormData({ comment: "" }); // Reset form data
    }
  };

  // Handle row click to view feedback details
  const handleRowClick = (feedback) => {
    setSelectedFeedback(feedback);
    setIsViewModalOpen(true);
  };

  // Format date to "30 Jul 2024 at 12:16 PM"
  const formatDate = (date) => {
    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date);

    // Convert "am" or "pm" to uppercase
    return formattedDate.replace(/(am|pm)/gi, (match) => match.toUpperCase());
  };

  return (

    <>
      <Card>
        <div className="flex justify-between">
          <div className="text-black flex rounded-2 items-center gap-2 pb-6 pt-2">
            <Icon icon="eva:pie-chart-fill" className="h-7 w-7" />
            <p className="text-black font-bold text-lg flex items-center">User Feedbacks</p>
          </div>

          <button onClick={() => setIsAddModalOpen(true)} className='btn flex items-center gap-2 mb-4 btn-dark text-center dark:border-2 dark:border-white'>
            <Icon icon="clarity:plus-circle-line" className="w-4 h-4" /> Add Feedback
          </button>
        </div>

        <div className="overflow-x-auto -mx-6">
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
                          className="table-th"
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
                    <ListSkeleton />
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-5">
                        No feedbacks found!
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()} className="cursor-pointer relative" onClick={() => handleRowClick(row.original)}>
                          {row.cells.map((cell) => (
                            <td {...cell.getCellProps()} className="table-td">
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

        <AdvancedModal
          activeModal={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Feedback"
        >
          <form onSubmit={handleAddFeedback}>
            <Textarea
              name="comment"
              label="Comments"
              value={formData.comment}
              onChange={handleInputChange}
              error={errors.comments}
              placeholder="Enter your feedback comments"
              register={register}
            />
            <button type="submit" className="btn mt-2 mb-4 btn-dark text-center dark:border-2 dark:border-white">
              Submit
            </button>
          </form>
        </AdvancedModal>

        {selectedFeedback && (
          <AdvancedModal
            activeModal={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            title="View Feedback"
          >
            <div>
              <p className="pb-2"><strong>Feedback Giver:</strong> {selectedFeedback.feedback_giver_name}</p>
              <p className="pb-2"><strong>Feedback Receiver:</strong> {selectedFeedback.feedback_receiver_name}</p>
              <p className="pb-2"><strong>Comments:</strong> {selectedFeedback.comments}</p>
              <p className="pb-2"><strong>Updated At:</strong> {formatDate(new Date(selectedFeedback.updated_at))}</p>
            </div>
          </AdvancedModal>
        )}
      </Card>

      <EditFeedBack isModalOpen={isEditModalOpen} setIsModalOpen={setIsEditModalOpen} editFeedbackValue={editFeedbackValue} fetchFeedbacks={fetchFeedbacks} />

    </>
  );
};

export default UserFeedback;
