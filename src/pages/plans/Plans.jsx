import { fetchAuthGET } from '@/store/api/apiSlice';
import { React, useEffect, useState } from 'react'
import PricingPage from '../utility/pricing';
import Grid from '@/components/skeleton/Grid';
import Storage from './Storage';

export default function Plans() {

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { data } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/storage-plans/`);
                if (data) {
                    setPlans(data);
                }
            } catch (error) {
            } finally {
                setLoading(false);
            }
        }
        fetchData()
    }, [])


    return (
        <>
            <div className="mb-4">
                <Storage />
            </div>

            {loading && <Grid count='3' />}

            {
                !loading && (
                    plans.length === 0 ? (
                        <p className="text-center">No plans available</p>
                    ) : (
                        <PricingPage plans={plans} />
                    )
                )
            }

        </>
    )
}