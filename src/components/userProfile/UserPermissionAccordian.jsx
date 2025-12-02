import React, { useState, useEffect } from 'react';
import UserPermissionAccordionItem from './UserPermissionAccordionItem';
import { fetchAuthGET, fetchAuthPut } from '@/store/api/apiSlice';
import SkeletionTable from '../skeleton/Table';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { usePermissions } from './PermissionContext';

const UserPermissionAccordion = () => {
    const [permissionsTemplate, setPermissionsTemplate] = useState({});
    const [employeePermissions, setEmployeePermissions] = useState({});
    const [loading, setLoading] = useState(false);
    const { userId } = useParams();
    const { updatePermissions } = usePermissions() || { updatePermissions: () => {} };
    const userInfo = useSelector(state => state.auth.user);
    const [updating, setUpdating] = useState(false);



    useEffect(() => {
        const fetchPermissionsTemplate = async () => {
            try {
                setLoading(true);
                const { data } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/permissions/`);
                setPermissionsTemplate(data);
            } catch (error) {
                toast.error(`Error fetching permissions template: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchPermissionsTemplate();
    }, []);

    useEffect(() => {
        const fetchEmployeePermissions = async () => {
            try {
                if (!userId) return;
                setLoading(true);
                const { data } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/employee/${userId}/permissions/`);
                setEmployeePermissions(data.permissions);
            } catch (error) {
                toast.error(`Error fetching employee permissions: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployeePermissions();
    }, [userId]);

    const togglePermission = (key, subKey) => {
        setEmployeePermissions(prevState => ({
            ...prevState,
            [key]: {
                ...prevState[key],
                [subKey]: !prevState[key]?.[subKey],
            },
        }));
    };

    const toggleSelectAll = (key, isSelected) => {
        setEmployeePermissions(prevState => {
            const updatedPermissions = Object.keys(permissionsTemplate[key]).reduce((acc, subKey) => {
                acc[subKey] = isSelected;
                return acc;
            }, {});

            return {
                ...prevState,
                [key]: updatedPermissions,
            };
        });
    };

    const areAllSelected = (key) => {
        return employeePermissions[key] && Object.values(employeePermissions[key]).every(value => value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);
            const response = await fetchAuthPut(`${import.meta.env.VITE_APP_DJANGO}/employee/${userId}/permissions/`, { body: { permissions: employeePermissions } });
            if (response.status) {
                toast.success('Permissions updated successfully');
                updatePermissions(employeePermissions);
            } else {
                toast.error('Failed to update permissions');
            }
        } catch (error) {
            toast.error(`Error updating permissions: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="p-4">
            {loading ? (
                <SkeletionTable count='20' />
            ) : (
                <form onSubmit={handleSubmit}>
                    <div>
                        {Object.entries(permissionsTemplate)
                          .filter(([key]) => !["Attendance", "Notice", "Leave", "Client"].includes(key))
                          .map(([key, value], index) => (
                            <UserPermissionAccordionItem
                                key={index}
                                title={key}
                                isAllSelected={areAllSelected(key)}
                                onSelectAll={(isSelected) => toggleSelectAll(key, isSelected)}
                            >
                                <div className="">
                                    {Object.entries(value).map(([subKey, subValue], subIndex) => (
                                        <label key={subIndex} className="flex items-center mb-2 ml-3">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500 transition duration-150 ease-in-out"
                                                onChange={() => togglePermission(key, subKey)}
                                                checked={!!employeePermissions[key]?.[subKey]}
                                            />
                                            <span className="ml-3 text-gray-700 dark:text-gray-300">{`${subKey}: ${subValue}`}</span>
                                        </label>
                                    ))}
                                </div>
                            </UserPermissionAccordionItem>
                        ))}
                    </div>

                    {userInfo.isAdmin && (
                        <div className="ltr:text-left rtl:text-left mt-6">
                            <button type='submit' className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700  transition duration-150 ease-in-out">{updating ? 'Updating...' : 'Update'}</button>
                        </div>
                    )}

                </form>
            )}

        </div>
    );
};

export default UserPermissionAccordion;
