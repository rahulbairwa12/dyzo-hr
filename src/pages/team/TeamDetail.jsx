import Button from '@/components/ui/Button'
import Icons from '@/components/ui/Icon'
import { React, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { TeamMemberCard } from '@/components/teams/TeamMemberCard'
import { fetchAuthPost, fetchGET } from '@/store/api/apiSlice'
import Grid from '@/components/skeleton/Grid'
import AddMemberPopup from '@/components/teams/AddMemberPopup'
import DeleteClientPopUp from '@/components/client/DeleteClientPopUp'

export default function TeamDetail() {
  const userInfo = useSelector(state => state.auth.user)
  const { teamId } = useParams()
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false)
  const [teamMemberId, setTeamMemberId] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)


  const fetchTeamMembers = async () => {
    try {
      const response = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/teams/${teamId}/`);
      if (response) {
        setTeamMembers(response.members)
        setTeamName(response.name)
      }
    } catch (error) {
      toast.error("Unable to fetch team members")


    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamMembers();
  }, [teamId]);


  const handleDelete = async () => {
    try {
      setDeleteLoading(true)
      const response = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/team/${teamId}/remove_member/${teamMemberId}/`, {});
      if (response.status) {
        toast.success("Team member removed successfully")
        fetchTeamMembers()
        setShowRemoveMemberModal(false)
      }
    } catch (error) {
      toast.error("Unable to remove team member")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <div className='flex justify-between items-center' >
        <div className="text-black flex rounded-2 items-center gap-2" onClick={() => navigate(-1)}>
          <Icons icon='weui:back-outlined' className='w-7 h-7 cursor-pointer' />
          <p className="text-black font-normal text-lg flex items-center">{teamName}</p>
        </div>

        {(userInfo?.isAdmin || userInfo?.team_leader) && (
          <div className="flex items-center gap-2">
            <Button text="Add Member" icon="heroicons-outline:plus" className='btn-dark dark:bg-slate-800  h-min text-sm font-normal' onClick={() => setShowAddMemberModal(true)} />
          </div>
        )}
      </div>

      {
        (loading) ? (
          <p><Grid /></p>
        ) : (

          teamMembers.length === 0 ? (
            <p className='text-center'>No team members available</p>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 my-8'>
              {
                teamMembers.map((member) => (<TeamMemberCard member={member} setTeamMemberId={setTeamMemberId} setShowRemoveMemberModal={setShowRemoveMemberModal} />))
              }
            </div>
          )

        )
      }
      {<AddMemberPopup showAddMemberModal={showAddMemberModal} setShowAddMemberModal={setShowAddMemberModal} teamId={teamId} fetchTeamMembers={fetchTeamMembers} teamMembers={teamMembers} />}

      {<DeleteClientPopUp showModal={showRemoveMemberModal} onClose={() => setShowRemoveMemberModal(false)} handleDelete={handleDelete} loading={deleteLoading} />}
    </div>
  )
}
