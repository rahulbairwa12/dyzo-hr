import { React, useEffect, useState } from 'react'
import Switch from '@/components/ui/Switch'
import { useSelector } from 'react-redux'
import Button from '../ui/Button'
import { fetchAuthPatch } from '@/store/api/apiSlice'
import { toast } from 'react-toastify'

const UserSetting = ({ employeeDetail,fetchEmployeeDetail }) => {
    const userInfo = useSelector((state) => state.auth.user)
    const [isAdmin, setIsAdmin] = useState(employeeDetail?.isAdmin)
    const [isTeamLeader, setIsTeamLeader] = useState(employeeDetail?.team_leader)
    const [isActive, setIsActive] = useState(employeeDetail?.isActive)
    const [loading, setLoading] = useState(false)
    

    useEffect(() => {
        setIsAdmin(employeeDetail?.isAdmin)
        setIsTeamLeader(employeeDetail?.team_leader)
        setIsActive(employeeDetail?.isActive)
    }, [employeeDetail])

    const handleSubmit = async (event) => {
        event.preventDefault()
        try {
            setLoading(true)
            const isUpdate = await fetchAuthPatch(`${import.meta.env.VITE_APP_DJANGO}/employee/${employeeDetail._id}/`, { body: { isAdmin: isAdmin, isActive: isActive, team_leader: isTeamLeader } })
            if (isUpdate.status) {
               toast.success('User power updated successfully')
               fetchEmployeeDetail()
            }

        } catch (error) {
            toast.error('Failed to update user power')
        }finally{
            setLoading(false)
        }
    }

    return (
        <div className='w-full '>

            <div className='flex justify-between items-center py-6 border-b-2 border-white'>
                <div>
                    <p className="">Admin</p>
                    <p className="">The admin has full access to all modules.</p>

                </div>
                <Switch
                    activeClass="bg-primary-500"
                    value={isAdmin}
                    onChange={() => setIsAdmin(!isAdmin)}
                    badge
                    prevIcon="tdesign:user-1"
                    nextIcon="lucide:user-x"
                    disabled={!userInfo?.isAdmin}

                />
            </div>

            <div className='flex justify-between items-center py-6 border-b-2 border-white'>
                <div>
                    <p className="">Team Leader</p>
                    <p className="">Team leader only make their team  </p>
                </div>

                <Switch

                    activeClass="bg-primary-500"
                    value={isTeamLeader}
                    onChange={() => setIsTeamLeader(!isTeamLeader)}
                    badge
                    prevIcon="tdesign:user-1"
                    nextIcon="lucide:user-x"
                    disabled={!userInfo?.isAdmin}
                />
            </div>

            <div className='flex justify-between items-center py-6 border-b-2 border-white'>
                <div>
                    <p className="">Active</p>
                    <p className="">Want to make user active </p>
                </div>


                <Switch
                    activeClass="bg-primary-500"
                    value={isActive}
                    onChange={() => setIsActive(!isActive)}
                    badge
                    prevIcon="tdesign:user-1"
                    nextIcon="lucide:user-x"
                    disabled={!userInfo?.isAdmin}
                />
            </div>

            {
                userInfo?.isAdmin && (
                    <Button type="submit" text="Update" className="bg-black-500 text-white mt-4" onClick={handleSubmit} isLoading={loading} />
                )
            }


        </div>
    )
}

export default UserSetting