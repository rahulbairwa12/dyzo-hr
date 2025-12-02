import React from "react";
import { ToastContainer, toast } from "react-toastify";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { fetchDelete } from "@/store/api/apiSlice";
import { Icon } from "@iconify/react";


const DeletePopup = ({ id, title, description, setOpen, setLoading, loading }) => {
  const deleteTask = async () => {
    setLoading(true);
    try {
      const response = await fetchDelete(`${import.meta.env.VITE_APP_DJANGO}/api/tasks/${id}`);
      if (response.status == 1) {
        toast.success("Task deleted successfully");
      } else {
        toast.error("Failed to delete task");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the task");
    }
    setLoading(false);
    setOpen(false); // Close the modal after action
  };

  return (
    <>
      <ToastContainer />
      <div className={`relative z-10`} aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex items-center justify-center rounded-full bg-red-100 p-2">
                    <Icon icon="zondicons:exclamation-outline" lassName="text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <div className="text-lg font-medium leading-6 text-gray-900" id="modal-title">{title}</div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={deleteTask}
                  disabled={loading} // Disable button when loading
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setOpen(false)}
                  disabled={loading} // Disable button when loading
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeletePopup;
