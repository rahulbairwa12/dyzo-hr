import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Fileinput from "@/components/ui/Fileinput";
import { fetchAuthFilePost } from "@/store/api/apiSlice";

const ImportModal = ({ showImportModal, setShowImportModal, fetchHolidays }) => {
    const userInfo = useSelector((state) => state.auth.user);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);

    const {
        handleSubmit,
    } = useForm();

    const onFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
    };

    const onSubmit = async () => {
        if (!file) {
            toast.error("Please upload a file.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const response = await fetchAuthFilePost(`${import.meta.env.VITE_APP_DJANGO}/upload-holidays/${userInfo?.companyId}/`, { body: formData });

            if (response.status) {
                setShowImportModal(false);
                toast.success('Holidays imported successfully');
                fetchHolidays();
            } else {
                toast.error('Failed to import holidays');
            }
        } catch (error) {
            toast.error('An error occurred while uploading the file');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Modal
                title="Import Holidays"
                labelclassName="btn-outline-dark"
                activeModal={showImportModal}
                onClose={() => setShowImportModal(false)}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Fileinput onChange={onFileChange} selectedFile={file} />

                    <div className="ltr:text-right rtl:text-left">
                        <button type="submit" className="btn btn-dark text-center" disabled={loading}>
                            {loading ? 'Importing...' : "Import"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ImportModal;
