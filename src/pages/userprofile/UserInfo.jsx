import EmployeeDetailModal from '@/components/userProfile/EmployeeDetailModal';
import { Icon } from '@iconify/react'
import React, { useState } from 'react'
import { Link } from 'react-router-dom';

const UserInfo = ({employeeDetail , fetchEmployeeDetail , isAccessable}) => {
    const [showEditModal , setShowEditModal] = useState(false);

  return (
    <>
        <div className="border rounded-lg p-4 my-4 space-y-4">
            <div className="flex items-center gap-4">
                <h5 className="text-xl">Profile Information</h5>
                {
                    isAccessable &&
                    <Icon icon="nimbus:edit" className="text-base text-gray-500 dark:text-gray-300 cursor-pointer" 
                    onClick={()=>setShowEditModal(true)} />
                }
            </div>
            <div className="space-y-4">
                <div className="flex gap-4 items-start">
                    <Icon icon="bi:envelope" className="text-base text-gray-500" />
                    <div className="space-y-1">
                        <h6 className="text-base leading-4 text-gray-500">Email</h6>
                        <Link
                            to={`mailto:${employeeDetail?.email}`}
                            className="text-sm text-black-800 dark:text-gray-300 font-semibold"
                        >
                            {employeeDetail?.email}
                        </Link>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <Icon icon="bi:telephone-outbound" className="text-base text-gray-500"/>
                    <div className="space-y-1">
                        <h6 className="text-base leading-4 text-gray-500">Phone no.</h6>
                        <Link
                            to={`tel:${employeeDetail?.phone}`}
                            className="text-sm text-black-800 dark:text-gray-300 font-semibold"
                        >
                            {employeeDetail?.country_code} {employeeDetail?.phone}
                        </Link>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <Icon icon="bi:cake2" className="text-base text-gray-500"/>
                    <div className="space-y-1">
                        <h6 className="text-base leading-4 text-gray-500">Date of birth</h6>
                        <p className="text-sm text-black-800 dark:text-gray-300 font-semibold">{employeeDetail?.date_of_birth ? new Date(employeeDetail.date_of_birth).toLocaleDateString('en-GB') : ''}</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <Icon icon="streamline-ultimate:office-employee" className="text-base text-gray-500"/>
                    <div className="space-y-1">
                        <h6 className="text-base leading-4 text-gray-500">Designation</h6>
                        <p className="text-sm text-black-800 dark:text-gray-300 font-semibold">{employeeDetail?.designation}</p>
                    </div>
                </div>
            </div>
        </div>
        <EmployeeDetailModal
            employeeDetail={employeeDetail}
            showPersonalInfoModal={showEditModal}
            setShowPersonalInfoModal={setShowEditModal}
            fetchEmployeeDetail={fetchEmployeeDetail}
        />
    </>
  )
}

export default UserInfo