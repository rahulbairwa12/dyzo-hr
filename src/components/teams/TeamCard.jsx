import React, { useState } from 'react'
import Icons from '../ui/Icon'
import { intialLetterName } from '@/helper/initialLetterName'
import { Link, useNavigate } from 'react-router-dom'
import EditTeamModal from './EditTeamModal'
import { fetchDelete } from '@/store/api/apiSlice'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import DeleteClientPopUp from '../client/DeleteClientPopUp'
import Tooltip from '../ui/Tooltip'

// Define the status mapping outside the component for better performance
const statusMapping = {
    'Active': { emoji: '🟢', color: 'bg-green-400', text: 'Active' },
    'Away': { emoji: '🕒', color: 'bg-yellow-400', text: 'Away' },
    'Do not disturb': { emoji: '⛔', color: 'bg-red-500', text: 'Do not disturb' },
    'In a meeting': { emoji: '📅', color: 'bg-blue-500', text: 'In a meeting' },
    'Out sick': { emoji: '🤒', color: 'bg-pink-500', text: 'Out sick' },
    'Commuting': { emoji: '🚗', color: 'bg-blue-300', text: 'Commuting' },
    'On leave': { emoji: '🌴', color: 'bg-purple-500', text: 'On leave' },
    'Focusing': { emoji: '🔕', color: 'bg-gray-500', text: 'Focusing' },
    'Working remotely': { emoji: '🏠', color: 'bg-blue-400', text: 'Working remotely' },
    'Offline': { emoji: '📴', color: 'bg-gray-300', text: 'Offline' },
    'Out for Lunch': { emoji: '🍽️', color: 'bg-yellow-300', text: 'Out for Lunch' },
}

export default function TeamCard({ team, fetchTeams }) {

    const userInfo = useSelector((state) => state.auth.user)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [teamDetail, setTeamDetail] = useState({})
    const [teamId, setTeamId] = useState(null)
    const [teamDeleteLoading, setTeamDeleteLoading] = useState(false)
    const navigate = useNavigate()

    const handleDelete = async () => {
        try {
            setTeamDeleteLoading(true)
            const response = await fetchDelete(`${import.meta.env.VITE_APP_DJANGO}/team/delete/${teamId}/${userInfo._id}`)
            if (response.status) {
                toast.success("Team Deleted successfully");
                fetchTeams()
                setTeamId(null)
                setShowDeleteModal(false);
            }
        } catch (error) {
            toast.error('Error while deleting team')
        } finally {
            setTeamDeleteLoading(false)
        }
    }

    return (
        <div
            className="border rounded-lg p-4 w-full max-w-sm bg-white dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
            onClick={() => navigate(`/team/${team.id}?name=${team.name.replace(/ /g, "-")}`)}
        >
            <div className="flex justify-between items-end my-2">
                <div className="font-medium text-base leading-6">
                    <div className="dark:text-slate-200 text-slate-900 max-w-[160px] truncate capitalize">
                        {team?.name}
                    </div>
                </div>

                {
                    (userInfo?.isAdmin || userInfo?.team_leader) && (
                        <div className="flex space-x-2">
                            <Tooltip
                                title="Edit team name"
                                content="Edit Team Name"
                                placement="top"
                                className="btn btn-outline-dark"
                                arrow
                                animation="shift-away"
                            >
                                <span
                                    className="focus:outline-none"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setShowEditModal(true);
                                        setTeamDetail(team)
                                    }}
                                >
                                    <Icons icon='heroicons-outline:pencil-alt' className='h-5 w-5 text-gray-500' />
                                </span>
                            </Tooltip>
                            <Tooltip
                                title="Remove Team"
                                content="Remove Team"
                                placement="top"
                                className="btn btn-outline-dark"
                                arrow
                                animation="shift-away"
                            >
                                <span
                                    className="focus:outline-none"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setShowDeleteModal(true);
                                        setTeamId(team.id)
                                    }}
                                >
                                    <Icons icon='heroicons-outline:trash' className='h-5 w-5 text-gray-500' />
                                </span>
                            </Tooltip>
                        </div>
                    )
                }
            </div>
            <div className="flex -space-x-2 mt-6">
                {
                    team?.members.slice(0, 3)?.map((member, index) => (
                        <Tooltip
                            key={index}
                            title={member?.name}
                            content={member?.name}
                            placement="top"
                            className="btn btn-outline-dark"
                            arrow
                            animation="shift-away"
                        >
                            <div className="relative inline-block">
                                {member?.profile_picture ? (
                                    <img
                                        src={`${import.meta.env.VITE_APP_DJANGO}${member?.profile_picture}`}
                                        alt={member?.name}
                                        className="w-10 h-10 rounded-full border-2 border-white object-cover object-center"
                                    />
                                ) : (
                                    <div className="relative">
                                        <span className="bg-[#002D2D] text-white flex justify-center border-2 border-white items-center rounded-full font-bold text-lg leading-none custom-avatar w-10 h-10 bg-cover bg-center">
                                            {intialLetterName(member?.first_name, member?.last_name, member?.name)}
                                        </span>
                                    </div>
                                )}
                                {/* {
                                    member?.status && statusMapping[member.status] && (
                                        <Tooltip 
                                            title={`${statusMapping[member.status].emoji} ${statusMapping[member.status].text}`} 
                                            content={`${statusMapping[member.status].text}${statusMapping[member.status].emoji}`} 
                                            placement="right" 
                                            className="btn btn-outline-dark" 
                                            arrow 
                                            animation="shift-away"
                                        >
                                            <span 
                                                className={`absolute bottom-0 right-0 block w-3 h-3 rounded-full ring-2 ring-white ${statusMapping[member.status].color}`} 
                                            ></span>
                                        </Tooltip>
                                    )
                                } */}
                            </div>
                        </Tooltip>
                    ))
                }
                {
                    team?.members.length > 3 && (
                        <Tooltip
                            title="More Members"
                            content={`${team.members.length - 3} more`}
                            placement="top"
                            className="btn btn-outline-dark"
                            arrow
                            animation="shift-away"
                        >
                            <div className="relative inline-block">
                                <span className="bg-[#002D2D] text-white flex justify-center border-2 border-white items-center rounded-full font-bold text-lg leading-none custom-avatar w-10 h-10">
                                    +{team.members.length - 3}
                                </span>
                            </div>
                        </Tooltip>
                    )
                }
            </div>
            <div className="mt-4">
                <Link
                    to={`/team/${team.id}?name=${team.name.replace(/ /g, "-")}`}
                    className="text-blue-500 text-sm"
                    onClick={(event) => event.stopPropagation()}
                >
                    View All
                </Link>
            </div>

            <EditTeamModal
                showEditModal={showEditModal}
                setShowEditModal={setShowEditModal}
                fetchTeams={fetchTeams}
                teamDetail={teamDetail}
                setTeamDetail={setTeamDetail}
            />

            <DeleteClientPopUp
                showModal={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                handleDelete={handleDelete}
                loading={teamDeleteLoading}
            />
        </div>
    )
}
