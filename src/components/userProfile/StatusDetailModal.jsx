import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../ui/Modal';
import Switch from "@/components/ui/Switch";
import { toast } from 'react-toastify';
import { fetchAuthPatch } from '@/store/api/apiSlice';

const StatusDetailModal = ({ employeeDetail, showPersonalInfoModal, setShowPersonalInfoModal, fetchEmployeeDetail }) => {
    const [active, setactive] = useState(employeeDetail.isActive);

    const {reset, handleSubmit } = useForm({
        mode: "all",
        defaultValues: {
            isActive: employeeDetail?.isActive || "",
        },
    });

    useEffect(() => {
        reset({
            isActive: employeeDetail?.isActive || "",
        });
    }, [employeeDetail, reset]);

    const handleClose = () => {
        setactive(employeeDetail.isActive);
        reset({
            isActive: employeeDetail?.isActive || "",
        });
        setShowPersonalInfoModal(false);
    };

    const onSubmit = async (data) => {
        const formattedData = {
            ...data,
            isActive: active,
        };

        try {
            const isDetailUpdate = await fetchAuthPatch(`${import.meta.env.VITE_APP_DJANGO}/employee/${employeeDetail?._id}/`, { body: formattedData });
            if (isDetailUpdate.status) {
                toast.success('Details updated successfully');
                fetchEmployeeDetail();
                setShowPersonalInfoModal(false);
            }
        } catch (error) {
            toast.error('Failed to update details. Please try again later.');
        }
    };

    return (
        <div>
            <Modal
                title="Edit Status"
                labelclassName="btn-outline-dark"
                activeModal={showPersonalInfoModal}
                onClose={handleClose}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="ltr:text-right rtl:text-left">
                        <Switch
                            label="Active"
                            activeClass="bg-green-500"
                            value={active}
                            onChange={() => setactive(!active)}
                        />
                        <button className="btn btn-dark text-center">Save</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StatusDetailModal;
