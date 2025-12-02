import { React, useState } from 'react'
import Modal from '../ui/Modal'
import Textinput from '../ui/Textinput'
import { fetchPOST } from '@/store/api/apiSlice';
import { useForm } from 'react-hook-form';
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from 'yup';
import Button from '../ui/Button';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';


const CreateTeamModal = ({ showAddTeamModal, setShowAddTeamModal, fetchTeams }) => {
    const userInfo = useSelector(state => state.auth.user);

    const FormValidationSchema = yup.object({
        teamName: yup.string().required('Team Name is required').trim().max(50, 'Team Name cannot exceed 50 characters').matches(/^[A-Za-z\s-_]+$/, 'Team Name must contain only letters, spaces, hyphens and underscores')
    }).required();

    const { register, control, reset, formState: { errors }, handleSubmit } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "all",
    });

    const onSubmit = async (data) => {
        try {
            const response = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/teams/create/${userInfo?._id}/`, { body: { "name": data.teamName } });
            if (response) {
                toast.success("Team created successfully");
                fetchTeams()
                setShowAddTeamModal(false);
                reset();
            }
        } catch (error) {
            toast.error('Error creating team');
        }
    };

    return (
        <Modal title="Create Team" activeModal={showAddTeamModal} onClose={() => setShowAddTeamModal(false)} labelclassName="btn-outline-dark">
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

export default CreateTeamModal