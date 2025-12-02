import { React, useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Textinput from '../ui/Textinput'
import { fetchAuthPatch} from '@/store/api/apiSlice';
import { useForm } from 'react-hook-form';
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from 'yup';
import Button from '../ui/Button';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';


const EditTeamModal = ({ showEditModal, setShowEditModal, fetchTeams, teamDetail, setTeamDetail }) => {

    const FormValidationSchema = yup.object({
        teamName: yup.string().required("Team Name is required")
    }).required();

    const { register, control, reset, formState: { errors }, handleSubmit } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "all",
        defaultValues: {
            teamName: teamDetail.name
        }
    });

    useEffect(() => {
        reset({ teamName: teamDetail.name });
    }, [teamDetail]);


    const onSubmit = async (data) => {
        try {
            const response = await fetchAuthPatch(`${import.meta.env.VITE_APP_DJANGO}/team/${teamDetail?.id}/update/`, { body: { "name": data.teamName } });
            if (response.status) {
                toast.success("Team name updated successfully");
                fetchTeams()
                setTeamDetail({})
                setShowEditModal(false);
                reset();
            }
        } catch (error) {
            toast.error('Error whitle updateing name team');
        }
    };

    return (
        <Modal title="Edit Team" activeModal={showEditModal} onClose={() => setShowEditModal(false)} labelclassName="btn-outline-dark">
            <form onSubmit={handleSubmit(onSubmit)}>
                <Textinput
                    name="teamName"
                    label="Team Name"
                    placeholder="Team Name"
                    register={register}
                    error={errors.teamName}
                />
                <Button type="submit" text="Submit" className="bg-black-500 text-white mt-2" onClick={handleSubmit} />
            </form>
        </Modal>
    )
}

export default EditTeamModal