
import { React } from 'react'
import Modal from '../ui/Modal'
import Textinput from '../ui/Textinput'
import { fetchPOST } from '@/store/api/apiSlice';
import { useForm } from 'react-hook-form';
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from 'yup';
import Button from '../ui/Button';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';


const SkillModal = ({ showSkillModal, setShowSkillModal, fetchSkillData }) => {
    const userInfo = useSelector(state => state.auth.user);

    const FormValidationSchema = yup.object({
        skill_name: yup.string().required("Skill name is required")
    }).required();

    const { register, control, reset, formState: { errors }, handleSubmit } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "all",
    });

    const onSubmit = async (data) => {
        try {
            const response = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/employee/skills-by/${userInfo?._id}/`, { body: { skill_name: data.skill_name, userId: userInfo?._id } });
            if (response) {
                toast.success("Skill added successfully");
                fetchSkillData();
                setShowSkillModal(false);
                reset();
            }
        } catch (error) {
            toast.error('Error creating team');
        }
    };

    return (
        <Modal title="Add Skill" activeModal={showSkillModal} onClose={() => setShowSkillModal(false)} labelclassName="btn-outline-dark">
            <form onSubmit={handleSubmit(onSubmit)}>
                <Textinput
                    name="skill_name"
                    label="Skill Name"
                    placeholder="Enter Skill Name"
                    register={register}
                    error={errors.skill_name}
                />
                <Button type="submit" text="Update" className="bg-black-500 text-white mt-2" onClick={handleSubmit} />
            </form>
        </Modal>
    )
}

export default SkillModal