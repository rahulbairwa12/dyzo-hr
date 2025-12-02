import React from "react";
import Modal from "@/components/ui/Modal";
import Button from "../ui/Button";
import Icon from "@/components/ui/Icon";

const DeleteClientPopUp = ({ showModal, onClose, handleDelete, loading }) => {

    return (
        <Modal
            title="Delete employee"
            activeModal={showModal}
            onClose={onClose}
            centered
            className="max-w-sm"
        >
            <div className="py-4">
              

                {/* Title */}
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 text-center mb-4">
                    Are you sure you want to delete?
                </h3>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-7">
                    <Button
                        text="Cancel"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
                    />

                    <Button
                        text="Delete"
                        onClick={handleDelete}
                        isLoading={loading}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        icon="heroicons-outline:trash"
                    />
                </div>
            </div>
        </Modal>
    );
};

export default DeleteClientPopUp;
