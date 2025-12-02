import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAuthGET } from '@/store/api/apiSlice';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
    const [permissions, setPermissions] = useState({});
    const userInfo = useSelector((state) => state.auth.user);

    useEffect(() => {
        const fetchPermissions = async () => {
            if (!userInfo) return;

            try {
                const response = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/employee/${userInfo._id}/permissions/`);
                if (response && response.data) {
                    setPermissions(response.data.permissions);
                }
            } catch (error) {
                toast.error(`Error fetching permissions: ${error.message}`);
            }
        };

        if (userInfo) {
            fetchPermissions();
        }

    }, [userInfo?._id]);

    const updatePermissions = (newPermissions) => {
        setPermissions(newPermissions);
    };

    return (
        <PermissionContext.Provider value={{ permissions, updatePermissions }}>
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermissions = () => useContext(PermissionContext);
