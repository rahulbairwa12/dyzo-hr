import { ToastContainer, toast } from "react-toastify";
import { fetchDelete } from "@/store/api/apiSlice";
import { Icon } from "@iconify/react";

const DeletePopup = ({
  id,
  title,
  description,
  setOpen,
  setLoading,
  loading,
  tasks,
  setTasks,
}) => {
  const deleteTask = async () => {
    setLoading(true);
    try {
      const response = await fetchDelete(
        `${import.meta.env.VITE_APP_DJANGO}/api/tasks/${id}`
      );
      if (response.status == 1) {
        toast.success("Task deleted successfully");
        setTasks(tasks.filter((task) => task.taskId !== id));
      } else {
        toast.error("Failed to delete task");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the task");
    }
    setLoading(false);
    setOpen(false);
  };

  return (
    <>
      <ToastContainer />
      <div
        className="relative z-[9999]"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop with fade animation */}
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300 ease-in-out"></div>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Modal with slide-up animation */}
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all duration-300 ease-out sm:my-8 sm:w-full sm:max-w-lg scale-100 opacity-100 translate-y-0">
              {/* Warning icon container */}
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex flex-col items-center">
                  <div className="mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                    <Icon
                      icon="zondicons:exclamation-outline"
                      className="text-red-600 w-8 h-8"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <h3
                      className="text-xl font-semibold leading-6 text-gray-900"
                      id="modal-title"
                    >
                      {title}
                    </h3>
                    <div className="mt-3">
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="bg-gray-50 px-6 py-4 flex justify-center gap-3">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2.5 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={deleteTask}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setOpen(false)}
                  disabled={loading}
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
