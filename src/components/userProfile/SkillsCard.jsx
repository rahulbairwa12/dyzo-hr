import { fetchAuthGET, fetchDelete } from '@/store/api/apiSlice';
import { React, useState, useEffect } from 'react';
import Loading from '../Loading';
import Cards from './Cards';
import SkillModal from './SkillModal';
import { useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

export const SkillsCard = () => {
    const { userId } = useParams();
    const [loading, setLoading] = useState(true);
    const [skillInformation, setSkillInformation] = useState([]);
    const [showSkillModal, setShowSkillModal] = useState(false);
    const userInfo = useSelector((state) => state.auth.user);

    const onClickEdit = () => {
        setShowSkillModal(true);
    }

    const fetchSkillData = async () => {
        try {
            const skill = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/employee/skills-by/${userId}/`);
            setSkillInformation(skill);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkillData();
    }, [userId]);

    const handleRemoveSkill = async (skillId) => {
        try {
            const response = await fetchDelete(`${import.meta.env.VITE_APP_DJANGO}/skills/${skillId}/`);
            if (response.status) {
                toast.success("Skill removed successfully");
                fetchSkillData();
            }
        } catch (error) {
            toast.error("Failed to remove skill");
        }
    };

    return (
        <div>
            <Cards title="Skills" onClick={onClickEdit}>
                {loading ? (
                    <div className="text-center"><Loading /></div>
                ) : (
                    skillInformation?.length > 0 ? (
                        <div className="grid  grid-cols-3 md:grid-cols-4 gap-4">
                            {skillInformation.map((skill, index) => (
                                <div key={index} className="flex justify-center">
                                    <button type="button" className="btn inline-flex justify-center btn-warning rounded-[100px] w-44 h-10 truncate  " title={skill.skill_name}>
                                        
                                        <span className="flex items-center">
                                            <span className='text-xs text-black-500 dark:text-white'>{skill.skill_name}</span>
                                        </span>

                                        {userInfo?._id == skill.userId && <span className='absolute top-3 right-3 text-black-500 ' onClick={() => handleRemoveSkill(skill.skillId)}> <Icon icon="oui:cross" className='w-4 h-4 cursor-pointer' /></span>}

                                        
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center">No Skills Found</div>
                    )
                )}
            </Cards>

            {<SkillModal showSkillModal={showSkillModal} setShowSkillModal={setShowSkillModal} fetchSkillData={fetchSkillData} />}
        </div>
    );
};
