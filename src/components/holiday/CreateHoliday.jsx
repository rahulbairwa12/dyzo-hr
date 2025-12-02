import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useSelector } from "react-redux";
import Textinput from "@/components/ui/Textinput";
import Flatpickr from "react-flatpickr";
import { useForm, Controller, set } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormGroup from "@/components/ui/FormGroup";
import { fetchPOST } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { formatDate } from "@/helper/helper";

const CreateHoliday = ({ showCreateModal, setShowCreateModal, fetchHolidays }) => {

    const userInfo = useSelector((state) => state.auth.user);
    const [loading, setLoading] = useState(false);

    const FormValidationSchema = yup.object(
        {
            name: yup.string().required("Title is required").trim().matches(/^\S.*$/, "Title cannot be only spaces").matches(/^[^\d]*$/, "Title cannot contain numbers").matches(/^[a-zA-Z\s]+$/, "Title must contain only letters and spaces"),

            date: yup.date().required('Date is required'),

        }).required();


    const {
        register,
        control,
        reset,
        formState: { errors },
        handleSubmit,
        setValue,
    } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "all",
    });

    useEffect(() => {
        setValue("date", new Date().toISOString().split('T')[0]);
    }, [showCreateModal]);

    const onSubmit = async (data) => {
        try {
            const formatedDate = formatDate(data.date);
            setLoading(true);
            const response = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/holiday/add/`, { body: { companyId: userInfo?.companyId, name: data.name, date: formatedDate } });
            if (response.success) {
                setShowCreateModal(false);
                toast.success('Holiday created successfully');
                reset();
                fetchHolidays()
            }
        } catch (error) {
            toast.error('Unable to create holiday');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Modal
                title="Add Holiday"
                labelclassName="btn-outline-dark"
                activeModal={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
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
                        {errors.date && <div className="text-danger-500 my-1">{errors.date.message}</div>}
                    </FormGroup>

                    <div className="ltr:text-right rtl:text-left">
                        <button type="submit" className="btn btn-dark  text-center" disabled={loading}>{loading ? 'Adding...' : "Add"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CreateHoliday;
