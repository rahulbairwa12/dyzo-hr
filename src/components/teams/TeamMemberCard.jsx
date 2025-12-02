import { intialLetterName } from '@/helper/initialLetterName';
import { Icon } from '@iconify/react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Tooltip from '../ui/Tooltip';

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
};

export const TeamMemberCard = ({ member, key, setShowRemoveMemberModal, setTeamMemberId }) => {
    const userInfo = useSelector((state) => state?.auth?.user);
    const navigate = useNavigate();

    // Function to map status to the correct icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'Active':
                return <Icon icon="line-md:reddit-circle-loop" />;
            case 'Away':
                return <Icon icon="svg-spinners:clock" />;
            case 'Do not disturb':
                return <Icon icon="line-md:cellphone-off" />;
            case 'In a meeting':
                return <Icon icon="line-md:phone-call-loop" />;
            case 'Out sick':
                return <Icon icon="line-md:emoji-cry" />;
            case 'Commuting':
                return <Icon icon="line-md:compass-twotone-loop" />;
            case 'On leave':
                return <Icon icon="meteocons:pollen-tree-fill" />;
            case 'Focusing':
                return <Icon icon="line-md:star-pulsating-twotone-loop" />;
            case 'Working remotely':
                return <Icon icon="line-md:home-md-twotone" />;
            case 'Offline':
                return <Icon icon="line-md:phone-off-loop" />;
            case 'Out for Lunch':
                return <Icon icon="line-md:coffee-twotone-loop" />;
            default:
                return null; // If no matching status, don't display an icon
        }
    };

    return (
        <div
            className="bg-white shadow-lg rounded-lg p-4 max-w-sm min-w-96 dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
            key={key}
            onClick={() => navigate(`/profile/${member._id}?name=${member.name.replace(/ /g, "-")}`)}
        >
            <div className="flex justify-between items-center">
                <div>
                    {member.team_leader && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Team Lead</span>
                    )}
                </div>

                {/* Display status icon and text */}
                <div className="flex items-center">
                    {getStatusIcon(member.status)}
                    <span className="ml-2">{member.status}</span>
                </div>

                {(userInfo?.isAdmin || userInfo?.team_leader) && (
                    <div className="flex space-x-2">
                        <Tooltip content="Feedback" placement="top" arrow animation="shift-away">
                            <span
                                onClick={(event) => {
                                    event.stopPropagation();
                                    navigate(`/user-feedbacks/${member._id}`);
                                }}
                            >
                                <Icon icon="fluent:person-feedback-32-light" className="w-6 h-6 cursor-pointer" />
                            </span>
                        </Tooltip>
                        <Tooltip content="Performance" placement="top" arrow animation="shift-away">
                            <span
                                onClick={(event) => {
                                    event.stopPropagation();
                                    navigate(`/performance/${member._id}`);
                                }}
                            >
                                <Icon icon="mdi:performance" className="w-6 h-6 cursor-pointer" />
                            </span>
                        </Tooltip>
                        <Tooltip content="Remove Member" placement="top" arrow animation="shift-away">
                            <span
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setShowRemoveMemberModal(true);
                                    setTeamMemberId(member._id);
                                }}
                            >
                                <Icon icon="ph:trash-light" className="w-6 h-6 cursor-pointer" />
                            </span>
                        </Tooltip>
                    </div>
                )}
            </div>

            <div className="text-center mt-4">
                <div className="relative inline-block">
                    {member.profile_picture ? (
                        <img
                            className="w-16 h-16 rounded-full mx-auto object-cover"
                            src={`${import.meta.env.VITE_APP_DJANGO}${member.profile_picture}`}
                            alt="member profile"
                        />
                    ) : (
                        <div className="relative">
                            <span className="bg-[#002D2D] text-white flex justify-center items-center font-bold text-lg leading-none custom-avatar w-16 h-16 rounded-full mx-auto bg-cover bg-center">
                                {intialLetterName(member?.first_name, member?.last_name, member?.name)}
                            </span>
                        </div>
                    )}

                    {/* Status Indicator */}
                    {/* {member?.status && statusMapping[member.status] && (
                        <Tooltip
                            title={`${statusMapping[member.status].emoji} ${statusMapping[member.status].text}`}
                            content={`${statusMapping[member.status].text}${statusMapping[member.status].emoji}`}
                            placement="right"
                            className="btn btn-outline-dark"
                            arrow
                            animation="shift-away"
                        >
                            <span
                                className={`absolute bottom-0 right-0 block w-4 h-4 rounded-full ring-2 ring-white ${statusMapping[member.status].color}`}
                               
                            ></span>
                        </Tooltip> 
                    )} */}
                </div>

                <h2 className="mt-2 font-semibold text-lg capitalize text-gray-700 dark:text-gray-300">{member.name}</h2>
                <p className="text-gray-600 dark:text-gray-400">{member.designation}</p>
                <Link to={`mailto:${member.email}`} className="text-gray-500 dark:text-gray-400">
                    {member.email}
                </Link>
            </div>
        </div>
    );
};
