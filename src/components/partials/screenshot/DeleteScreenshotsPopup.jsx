import { Icon } from "@iconify/react";

const DeleteScreenshotsPopup = ({ title, description, setOpen, setLoading, loading, onDelete }) => {
  const handleDelete = async () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <>
      <div className={`relative z-[112]`} aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"></div>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-10 text-center">
            <div className="rel12tive p-8 px-12 dark:bg-customBlack-200 dark:text-customWhite-50 transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all w-full max-w-[400px] mx-auto">
              <div className="flex flex-col items-center">
                <div className="bg-[#FFEAE7] rounded-full p-1.5 mb-5">
                  <div className="flex items-center justify-center p-1 rounded-full bg-[#F6D7D6]">
                    <Icon icon="fluent:error-circle-48-regular" className="text-customRed-50" width="30" height="30" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-customBlack-50 dark:text-customWhite-50" id="modal-title">{title}</h3>
                <div className="mt-2">
                  <p className="text-base text-center text-customBlack-100 dark:text-customWhite-50">
                    {description}
                  </p>
                </div>
              </div>
              <div className="flex justify-between mt-7 gap-5">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 px-10 py-1.5 bg-neutral-150 text-customBlack-100 font-bold shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md px-10 py-1.5 bg-customRed-50 text-white font-semibold shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteScreenshotsPopup; 