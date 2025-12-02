import React, { useEffect } from "react";
import { Icon } from "@iconify/react";

const DeletePopup = ({
  title = "Delete Tasks",
  description = "Are you sure you want to delete 1 task?\nThis action cannot be undone.",
  setOpen,
  setLoading,
  loading,
  onConfirm,
}) => {
  // Prevent background scroll
  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  const handleDelete = async () => {
    if (onConfirm) {
      setLoading(true);
      await onConfirm();
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black-500/50 backdrop-blur-sm"></div>

      <div
        className="
          relative bg-white rounded-xl shadow-2xl
          w-full max-w-sm
          max-h-[90vh] flex flex-col items-center
          p-6 
          overflow-y-auto
        "
        style={{ filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.1))" }}
      >
        <div
          className="flex items-center justify-center mb-4 rounded-full bg-red-100 w-12 h-12"
          style={{ boxShadow: "0 0 0 8px rgb(254 202 202 / 0.5)" }}
        >
          <Icon icon="zondicons:exclamation-outline" className="text-red-600 w-5 h-5" />
        </div>
        <h2 className="font-semibold text-center text-gray-900 text-lg mb-2" id="modal-title">
          {title}
        </h2>
        <p className="text-center text-gray-800 text-sm mb-6 leading-relaxed" style={{ whiteSpace: "pre-line" }}>
          {description}
        </p>
        <div className="flex space-x-4 w-full justify-center">
          <button
            onClick={() => setOpen(false)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-md px-6 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            type="button"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md px-6 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePopup;