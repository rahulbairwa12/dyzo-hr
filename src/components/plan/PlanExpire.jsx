import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { checkPlans } from '@/context/PlanCheck';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PlanExpire = () => {
    const userInfo = useSelector(state => state.auth.user);
    const { isPlanExpired } = checkPlans();
    const [open, setOpen] = useState(isPlanExpired);
    const navigate = useNavigate();

    useEffect(() => {
        setOpen(isPlanExpired);
    }, [isPlanExpired]);

    const handleClose = () => {
        if (userInfo?.isAdmin) {
            setOpen(false);
        }
    };

    return (
        <Modal title='' activeModal={open} onClose={handleClose}>
            <div className="flex justify-center items-center"> 
                <div className="rounded-lg p-6 w-[400px]">
                    <div className="flex flex-col items-center"> 
                        <h2 className="text-base font-bold text-red-600 mt-4 dark:text-white">
                            YOUR PLAN IS EXPIRED
                        </h2>
                        {userInfo?.isAdmin ? (<p className="text-gray-600 mt-2 text-center text-xs dark:text-white">
                            Please upgrade your plan to continue using the application 
                        </p>):
                        (<p className="text-gray-600 mt-2 text-center text-xs dark:text-white">
                            Please contact your admin to upgrade the plan</p>)}
                        <button
                            className="bg-red-500 text-white font-semibold mt-6 py-2 px-4 rounded hover:bg-red-600"
                            onClick={userInfo?.isAdmin ? () => navigate('/user-plans') : null}
                        >
                            Upgrade
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PlanExpire;
