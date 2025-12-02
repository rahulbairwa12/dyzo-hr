import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { djangoBaseURL } from "@/helper";
import { fetchAuthGET } from "@/store/api/apiSlice";

const EmployeeAuthContext = createContext();

export const EmployeeContext = ({ children }) => {
    const [employeeList, setEmployeeList] = useState([]);  // Default to empty array
    const userInfo = useSelector((state) => state.auth.user);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                if (!userInfo) return;

                let url = "";
                if (userInfo.isAdmin || userInfo?.user_type === 'client') {
                    url = `${djangoBaseURL}/employee/list/${userInfo.companyId}/`;
                } else if (userInfo.team_leader) {
                    url = `${djangoBaseURL}/api/team/members/${userInfo._id}/`;
                } else {
                    url = `${djangoBaseURL}/employee/me/list/${userInfo._id}/`;
                }

                const { data } = await fetchAuthGET(url);
                if (data) setEmployeeList(data);

            } catch (error) {
                console.error("Error fetching employee", error);
            }
        };

        if (employeeList.length === 0 && userInfo) {
            fetchEmployee();
        }
    }, [userInfo, employeeList.length]);

    const value = useMemo(() => ({ employeeList }), [employeeList]);

    return (
        <EmployeeAuthContext.Provider value={value}>
            {children}
        </EmployeeAuthContext.Provider>
    );
};

export const useEmployeeAuth = () => useContext(EmployeeAuthContext);
