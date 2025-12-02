import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useSelector } from "react-redux";
import Textinput from "@/components/ui/Textinput";
import Flatpickr from "react-flatpickr";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormGroup from "@/components/ui/FormGroup";
import { fetchAuthPatch } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { formatDate } from "@/helper/helper";

const EditHoliday = ({ showHolidayEditModal, setShowHolidayEditModal, fetchHolidays, data, setData, holidayId, setHolidayId }) => {
    const userInfo = useSelector((state) => state.auth.user);
    const [loading, setLoading] = useState(false);

    const FormValidationSchema = yup.object({
        name: yup.string()
            .required("Title is required")
            .trim()
            .matches(/^\S.*$/, "Title cannot be only spaces")
            .matches(/^[^\d]*$/, "Title cannot contain numbers")
            .matches(/^[a-zA-Z\s]+$/, "Title must contain only letters and spaces"),
        date: yup.date().required('Date is required'),
    }).required();

    const {
        register,
        control,
        reset,
        formState: { errors },
        handleSubmit,
    } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "all",
    });

    useEffect(() => {
        if (data) {
            reset({
                name: data?.name,
                date: data?.date
            });
        }
    }, [data, reset]);

    const onSubmit = async (formData) => {
        try {
            setLoading(true);
            const formattedDate = formatDate(formData.date);
            const response = await fetchAuthPatch(`${import.meta.env.VITE_APP_DJANGO}/holiday/update/${holidayId}/`, {
                body: JSON.stringify({
                    companyId: userInfo?.companyId,
                    name: formData.name,
                    date: formattedDate,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.success) {
                setShowHolidayEditModal(false);
                toast.success('Holiday updated successfully');
                reset();
                fetchHolidays();
                setData({});
                setHolidayId(null);
            }
        } catch (error) {
            toast.error('Unable to update holiday');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Modal
                title="Edit Holiday"
                labelclassName="btn-outline-dark"
                activeModal={showHolidayEditModal}
                onClose={() => setShowHolidayEditModal(false)}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Textinput
                        name="name"
                        label="Holiday Name"
                        placeholder="Holiday Name"
                        register={register}
                        error={errors.name}
                    />

                    <FormGroup
                        label="Date"
                        id="default-picker2"
                    >
                        <Controller
                            name="date"
                            control={control}
                            render={({ field }) => (
                                <Flatpickr
                                    className="form-control py-2"
                                    id="default-picker2"
                                    placeholder="yyyy, dd M"
                                    value={field.value ? new Date(field.value) : new Date()}
                                    onChange={(date) => {
                                        const utcDate = new Date(date[0].getTime() - date[0].getTimezoneOffset() * 60000);
                                        field.onChange(utcDate.toISOString().split('T')[0]);
                                    }}
                                    options={{
                                        altInput: true,
                                        altFormat: "d F Y",
                                        dateFormat: "Y-m-d",
                                    }}
                                />
                            )}
                        />
                    </FormGroup>

                    <div className="ltr:text-right rtl:text-left">
                        <button type="submit" className="btn btn-dark text-center" disabled={loading}>
                            {loading ? 'Updating...' : "Update"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default EditHoliday;
