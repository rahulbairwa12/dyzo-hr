import LoaderCircle from '@/components/Loader-circle'
import { fetchAPI } from '@/store/api/apiSlice'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const PlanContext = createContext()

export const PlanCheck = ({ children }) => {
    const userInfo = useSelector(state => state.auth.user)
    const [isPlanExpired, setIsPlanExpired] = useState(false)
    const [loading, setLoading] = useState(true) // Initially true, so API call can happen
    const navigate = useNavigate()


    useEffect(() => {
        const fetchPlans = async () => {
            if (!userInfo?.companyId) return;

            try {
                setLoading(true); // Start loading before fetching data
                const { is_expired } = await fetchAPI(`check-subscription-expiry/${userInfo.companyId}/`); 

                // setIsPlanExpired(is_expired ?? false); // Ensure boolean value
                setIsPlanExpired(false); // Ensure boolean value

                if (false) {
                    navigate('/settings/subscription'); // Navigate only if expired  
                }
            } catch (error) {
                console.error("Error fetching subscription data:", error);
            } finally {
                setLoading(false); // Stop loading after API call
            }
        };

        fetchPlans();
    }, [userInfo?.companyId, navigate]); // Ensure the effect re-runs when user info changes new

    return (
        <PlanContext.Provider value={{ isPlanExpired, setIsPlanExpired, loading, setLoading }}>
            {loading ? <LoaderCircle /> : children}
        </PlanContext.Provider>
    );
};

export const checkPlans = () => {
    return useContext(PlanContext);
};
