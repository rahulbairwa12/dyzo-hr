import EmployeeList from '@/components/employee/EmployeeList';
import SkeletionTable from '@/components/skeleton/Table';
import { fetchAuthGET } from '@/store/api/apiSlice'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';

const CompanyEmployeeList = () => {
    const [companyEmployee, setCompanyEmployee] = useState([]);
    const [loading, setLoading] = useState(false);
    const { companyId } = useParams()

    useEffect(() => {
        const fetchCompanyEmployee = async () => {
            try {
                setLoading(true);
                const employee = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/employee/list/${companyId}/`);
                if (employee.status) {
                    setCompanyEmployee(employee.data);
                } else {
                    throw new Error(employee?.message);
                }
            } catch (error) {
                console.error("Error fetching company employee:", error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchCompanyEmployee();
    },[companyId])
    return (
        <>
            {loading ? <SkeletionTable count='20' /> : <EmployeeList employeesList={companyEmployee} />
            }
        </>
    )
}

export default CompanyEmployeeList