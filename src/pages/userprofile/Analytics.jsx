import React, { useEffect, useState } from "react";
import BasicArea from '../chart/appex-chart/BasicArea'
import { djangoBaseURL } from '@/helper';
import moment from 'moment';
import {fetchPOST } from "@/store/api/apiSlice";

const Analytics = ({employeeDetail}) => {
    const initialStartDate = moment().startOf('year').format('YYYY-MM-DD');
    const initialEndDate = moment().endOf('year').format('YYYY-MM-DD');
    const [performanceData, setPerformanceData] = useState({});
    const [performanceLoading, setPerformanceLoading] = useState(false);

    // Load performance data
    const fetchPerformanceData = async (start, end) => {
        try {
        setPerformanceLoading(true);
        const response = await fetchPOST(
            `${djangoBaseURL}/api/employee-performance/`,
            {
            body: {
                employee_id: employeeDetail?._id,
                start_date: start,
                end_date: end,
            },
            }
        );
        if (response) {
            setPerformanceData(response);
        }
        } catch (err) {
        console.error("Error fetching performance data: ", err);
        } finally {
        setPerformanceLoading(false);
        }
    };

    useEffect(() => {
        fetchPerformanceData(initialStartDate , initialEndDate);
    }, [employeeDetail?._id]);

  return (
    <div className="border rounded-lg p-4 my-4 space-y-4">
        <BasicArea performanceData = {performanceData?.employee_year_chart} />
    </div>
  )
}

export default Analytics