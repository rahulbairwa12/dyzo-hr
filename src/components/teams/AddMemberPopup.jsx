import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { fetchAuthGET, fetchAuthPost } from '@/store/api/apiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { intialLetterName } from '@/helper/initialLetterName';
import Icons from '../ui/Icon';
import LoaderCircle from '../Loader-circle';
import Button from '../ui/Button';

export default function AddMemberPopup({ showAddMemberModal, setShowAddMemberModal, teamId, fetchTeamMembers, teamMembers }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [employeesList, setEmployeesList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [addingMembers, setAddingMembers] = useState(false);

    const userInfo = useSelector(state => state.auth.user);

    useEffect(() => {
        const fetchEmployees = async () => {
            setLoading(true);
            try {
                const { data } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/employee/list/activeUsers/${userInfo?.companyId}`);

                if (data) {
                    // Filter only active employees
                    const activeEmployees = data.filter(emp => emp.isActive);
                    setEmployeesList(activeEmployees);
                }
            } catch (error) {
                toast.error("Unable to fetch employees list");
            } finally {
                setLoading(false);
            }
        };

        if (userInfo?.companyId) {
            fetchEmployees();
        }
    }, [userInfo?.companyId]);

    const filteredEmployees = employeesList.filter(employee => employee.name.toLowerCase().includes(searchTerm.toLowerCase()) && !teamMembers.some(member => member._id === employee._id));

    const handleEmployeeSelection = (employee) => {
        setSelectedEmployees(prev =>
            prev.some(e => e._id === employee._id)
                ? prev.filter(e => e._id !== employee._id)
                : [...prev, employee]
        );
    };

    const handleRemoveSelectedEmployee = (employeeId) => {
        setSelectedEmployees(prev => prev.filter(e => e._id !== employeeId));
    };

    const addSelectedMembers = async () => {
        if (selectedEmployees.length === 0) {
            toast.error('Please select at least one member.');
            return;
        }

        setAddingMembers(true);
        try {
            let allMembersAdded = true;
            let errorMessage = '';
            for (const member of selectedEmployees) {
                const response = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/team/${teamId}/add_member/${member._id}/`, {});
                if (!response.status) {
                    allMembersAdded = false;
                    errorMessage = response.message || 'Failed to add some members';
                }
            }

            if (allMembersAdded) {
                toast.success('All members added successfully');
                setSelectedEmployees([]);
                fetchTeamMembers();
            } else {
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("error", error.message);
            const catchErrorMessage = error.response?.status === 400 && error.response.data?.message === "Member already in the team"
                ? error.response.data.message
                : 'An error occurred while adding members';
            toast.error(catchErrorMessage);
        } finally {
            setAddingMembers(false);
            setShowAddMemberModal(false);
        }
    };

    return (
        <Modal title='Add Member' activeModal={showAddMemberModal} onClose={() => setShowAddMemberModal(false)}>
            {loading ? (
                <div className="flex justify-center items-center h-[200px]">
                    <LoaderCircle />
                </div>
            ) : (
                <div>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="mt-2 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className='flex flex-wrap gap-3 my-3'>
                        {selectedEmployees.map((item, index) => (

                            <div className="flex flex-col items-center" key={index}>
                                <div className="relative">
                                    <div className="w-20 h-20 bg-[#002D2D] rounded-full flex items-center justify-center">
                                        {item.profile_picture ? (
                                            <img src={`${import.meta.env.VITE_APP_DJANGO}${item.profile_picture}`} alt={item.name} className="w-20 h-20 rounded-full"
                                            />
                                        ) : (
                                            <div className="text-white text-xl font-bold">
                                                {intialLetterName(item?.first_name, item?.last_name, item?.name)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute top-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center" onClick={() => handleRemoveSelectedEmployee(item._id)}>
                                        <Icons icon={'heroicons-outline:x'} className="text-white text-xs cursor-pointer" />
                                    </div>
                                </div>
                                <div className="mt-2 text-sm font-medium">{item.first_name}</div>
                            </div>
                        ))}
                    </div>
                    <div className="h-[300px] overflow-y-auto border-t border-gray-200 dark:border-gray-700">
                        {filteredEmployees.map(employee => (
                            <div
                                key={employee._id}
                                className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                                onClick={() => handleEmployeeSelection(employee)}
                            >
                                <div className="flex items-center gap-2">
                                    {employee.profile_picture ? (
                                        <img
                                            src={`${import.meta.env.VITE_APP_DJANGO}${employee.profile_picture}`}
                                            alt={employee.name}
                                            className="w-9 h-9 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="bg-[#002D2D] text-white flex justify-center items-center rounded-full font-bold text-lg custom-avatar w-9 h-9">
                                            {intialLetterName(employee?.first_name, employee?.last_name, employee?.name)}
                                        </span>
                                    )}
                                    <p className="text-gray-700 dark:text-gray-300 capitalize">{employee.name}</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="form-checkbox rounded-full text-primary-500"
                                    onChange={() => handleEmployeeSelection(employee)}
                                    checked={selectedEmployees.some(e => e._id === employee._id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end mt-4 gap-2">
                        <Button
                            text="Invite Member"
                            className="bg-black-500 text-white"
                            onClick={() => window.open('/invite-user', '_blank')}
                        />
                        <Button text="Add Member" className="bg-black-500 text-white" onClick={addSelectedMembers} isLoading={addingMembers} />
                    </div>
                </div>
            )}
        </Modal>
    );
}
