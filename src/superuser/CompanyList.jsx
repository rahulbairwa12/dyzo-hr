import SkeletionTable from '@/components/skeleton/Table';
import { fetchAuthGET } from '@/store/api/apiSlice';
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify';
import CompanyListTable from './CompanyListTable';

const CompanyList = () => {
    const [companyList, setCompanyList] = useState([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const fetchCompanyList = async() => {
            try{
                setLoading(true)
                const companiesList = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/super/api/companies/`)
                if(companiesList.length > 0){
                    setCompanyList(companiesList)
                }
            }catch{
               toast.error("Error in company list fetching")
            }finally{
                setLoading(false)
            }
        }
        fetchCompanyList()
    }, [])
  return (
    <>
      
      {
        loading ? <SkeletionTable count='20' /> : <CompanyListTable companyList={companyList} />
      }
    
    </>
    
  )
}

export default CompanyList