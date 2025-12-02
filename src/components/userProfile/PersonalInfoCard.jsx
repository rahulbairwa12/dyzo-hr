import React, { useEffect, useState } from 'react'
import Card from '../ui/Card'
import Icon from '../ui/Icon'
import { fetchAuthGET } from '@/store/api/apiSlice'
import { toast } from 'react-toastify'
import Loading from '../Loading'
import Cards from './Cards'
import { set } from 'react-hook-form'
import PersonalInformationModal from './PersonalInformationModal'
import { useParams } from 'react-router-dom'

export const PersonalInfoCard = () => {
   
    const {userId} =  useParams()
    const [loading, setLoading] = useState(false);
    const [personalInfo, setPersonalInfo] = useState({});
    const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);

    const onClickEdit = () => {
        setShowPersonalInfoModal(true);
    }

    const fetchPersonalInfo = async () => {
        try {
            setLoading(true);
            const { data } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/employee/${userId}/personal_information/`);
            if (data) {
                setPersonalInfo(data);
            }
        } catch (error) {
            toast.error('Failed to fetch personal information');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPersonalInfo();

    }, [userId])


    return (
        <div>
            {
                loading ? (<div className="text-center"><Loading /></div>) : (

                    <Cards title="Personal  Information" onClick={onClickEdit} >

                        <ul className="list space-y-8">
                            <li className="flex space-x-3 rtl:space-x-reverse">
                                <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                                    <Icon icon="pajamas:location" />
                                </div>
                                <div className="flex-1">
                                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                                        Nationality
                                    </div>
                                    <span className="text-base text-slate-600 dark:text-slate-50 capitalize">
                                        {personalInfo?.nationality}
                                    </span>
                                </div>
                            </li>

                            <li className="flex space-x-3 rtl:space-x-reverse">
                                <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                                    <Icon icon="solar:users-group-rounded-bold-duotone" />
                                </div>
                                <div className="flex-1">
                                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                                        Marital Status
                                    </div>
                                    <span className="text-base text-slate-600 dark:text-slate-50 capitalize">
                                        {personalInfo?.marital_status}
                                    </span>
                                </div>
                            </li>

                            {
                                (personalInfo?.marital_status === 'Married') &&

                                <li className="flex space-x-3 rtl:space-x-reverse">
                                    <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                                        <Icon icon="fa6-solid:children" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                                            Children
                                        </div>
                                        <span className="text-base text-slate-600 dark:text-slate-50 capitalize">
                                            {personalInfo?.number_of_children}
                                        </span>
                                    </div>
                                </li>
                            }


                            <li className="flex space-x-3 rtl:space-x-reverse">
                                <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                                    <Icon icon="mdi:passport" />
                                </div>
                                <div className="flex-1">
                                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                                        Passport Number
                                    </div>
                                    <span className="text-base text-slate-600 dark:text-slate-50">
                                        {personalInfo?.passport_number}
                                    </span>
                                </div>
                            </li>


                        </ul>
                    </Cards>
                )
            }

            {<PersonalInformationModal showPersonalInfoModal={showPersonalInfoModal} setShowPersonalInfoModal={setShowPersonalInfoModal} personalInfo={personalInfo} fetchPersonalInfo={fetchPersonalInfo} />}

        </div>
    )
}
