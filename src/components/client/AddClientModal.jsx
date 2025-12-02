import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useSelector } from "react-redux";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { fetchPOST } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import Switch from "@/components/ui/Switch";

const AddClientModal = ({ showAddClientModal, setShowAddClientModal, fetchClient }) => {
  const userInfo = useSelector((state) => state.auth.user);
  const [sendNotification, setSendNotification] = useState(false);

  const FormValidationSchema = yup.object({
    first_name: yup
      .string()
      .required("First name is required")
      .matches(/^[A-Za-z\s]+$/, "First name must only contain letters and spaces"),
    email: yup
      .string()
      .email("Email must be a valid email address")
      .nullable(),
    phone: yup
      .string()
      .nullable()
      .matches(/^[0-9()+\-\s]*$/, "Phone number is not valid"),
    password: yup
      .string()
      .required("Password is required"),
  }).required();


  const { register, control, reset, formState: { errors }, handleSubmit } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  // Reset form when the modal is closed
  useEffect(() => {
    
    if (!showAddClientModal) {
      reset({
        name: "",
        email: "",
        phone: "",
        address: "",
      });
      setSendNotification(false); // Reset notification toggle
    }
  }, [showAddClientModal, reset]);

  const onSubmit = async (data) => {
  
    try {
      const response = await fetchPOST(
        `${import.meta.env.VITE_APP_DJANGO}/employee/add/`,
        {
          body: {
            first_name: data?.first_name,
            last_name: data?.last_name,
            companyId: userInfo.companyId,
            email: data?.email,
            password: data.password,
            inviter_id: userInfo._id,
            phone: data?.phone,
            terms: true,
            is_client: true,
            getEmail: sendNotification,
          },
        }
      );
      if (response.status) {
        
        toast.success('Client added successfully');
        setShowAddClientModal(false);
        fetchClient();
        reset(); // Reset form after successful submission
      }
    } catch (error) {
      reset();
      setShowAddClientModal(false);

      
      toast.error(error?.response?.message || 'Failed to add client');
    }
  };

  return (
    <div>
      <Modal
        title="Add Client"
        labelclassName="btn-outline-dark"
        activeModal={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="first_name"
            label="First Name"
            placeholder="First Name"
            register={register}
            error={errors.first_name}
          />
          <Textinput
            name="last_name"
            label="Last Name"
            placeholder="Last Name"
            register={register}
            error={errors.last_name}
          />

          <Textinput
            name="email"
            label="Email"
            placeholder="Email"
            register={register}
            error={errors.email}
          />

          <Textinput
            name="phone"
            label="Phone"
            placeholder="Phone"
            register={register}
            error={errors.phone} // Display validation error if any
          />
          <Textinput
            name="password"
            label="Password"
            placeholder="Password"
            register={register}
            error={errors.password} // Display validation error if any
          />

          <div className="flex flex-wrap space-xy-5">
            <Switch
              label="Send Notification"
              activeClass="bg-primary-500"
              value={sendNotification}
              onChange={() => setSendNotification(!sendNotification)}
              badge
              prevIcon="material-symbols-light:mail-outline"
              nextIcon="material-symbols-light:mail-off-outline"
            />
          </div>

          <div className="ltr:text-right rtl:text-left">
            <button className="btn btn-dark text-center">Add</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AddClientModal;
