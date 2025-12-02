import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { Link, useNavigate } from "react-router-dom";
import ProgressBar from "@/components/ui/ProgressBar";
import { fetchAuthGET } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";
import { checkPlans } from "@/context/PlanCheck";
import PlanExpire from "@/components/plan/PlanExpire";

const Settings = () => {
    const [storage, setStorage] = useState({});
    const [company, setCompany] = useState(null);
    const [userPlan, setUserPlan] = useState(null);
    const [loading, setLoading] = useState(false); // Initialize loading state
    const userInfo = useSelector((state) => state.auth.user);

    const fetchStorageData = async () => {
        try {
            setLoading(true);
            const { data } = await fetchAuthGET(
                `${import.meta.env.VITE_APP_DJANGO}/company/${userInfo?.companyId}/storage/`
            );
            if (data) setStorage(data);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const data = await fetchAuthGET(
                `${import.meta.env.VITE_APP_DJANGO}/company/${userInfo?.companyId}/details/`
            );
            if (data) {
                setUserPlan(data.user_plans[0]);
                setCompany(data.company);
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userInfo?.companyId) {
            fetchStorageData();
            fetchUserData();
        }
    }, [userInfo?.companyId]);

    const totalEmployee = company?.total_employees || 0;
    const employeeLimit = company?.employee_limit || 1;
    const percentage = employeeLimit > 0 ? ((totalEmployee / employeeLimit) * 100).toFixed(2) : 0;

    const percentageStorage = (
        (storage?.used_storage_mb / storage?.user_plan?.storage) *
        100
    ).toFixed(2);
    const storageSizeGB = (storage?.user_plan?.storage / 1024).toFixed(2);
    const usedStorageGB = (storage?.used_storage_mb / 1024).toFixed(2);

    const navigate = useNavigate();

    // Safely destructure isPlanExpired
    const { isPlanExpired } = checkPlans() || {};

    return (
        <div>
            {isPlanExpired && <PlanExpire />}
            
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
                <Card>
                    <div
                        className="space-y-6 cursor-pointer"
                        onClick={() => navigate("/upgrade-plan")}
                    >
                        <div className="flex space-x-3 items-center rtl:space-x-reverse">
                            <div className="flex-none h-8 w-8 rounded-full bg-slate-800 dark:bg-slate-700 text-slate-300 flex flex-col items-center justify-center text-lg">
                                <Icon icon="mdi:user-tie" />
                            </div>
                            <div className="flex-1 text-base text-slate-900 dark:text-white font-medium">
                                User Plan
                            </div>
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">
                            <ProgressBar
                                value={percentage}
                                title={`${totalEmployee} Total User / ${employeeLimit} Total Limit`}
                                backClass="h-[14px] rounded-[999px]"
                                className="bg-slate-800"
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <Link
                                to="#"
                                className="inline-flex items-center space-x-3 rtl:space-x-reverse text-sm capitalize font-medium text-slate-600 dark:text-slate-300"
                            >
                                <span>Upgrade User Plan</span> <Icon icon="heroicons:arrow-right" />
                            </Link>

                            <Link
                                to="/user-transaction-history"
                                className="inline-flex items-center space-x-3 rtl:space-x-reverse text-sm capitalize font-medium text-slate-600 dark:text-slate-300"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <span>View Transactions</span> <Icon icon="heroicons:arrow-right" />
                            </Link>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div
                        className="space-y-6 cursor-pointer"
                        onClick={() => navigate("/upgrade-plan")}
                    >
                        <div className="flex space-x-3 items-center rtl:space-x-reverse">
                            <div className="flex-none h-8 w-8 rounded-full bg-primary-500 text-slate-300 flex flex-col items-center justify-center text-lg">
                                <Icon icon="bxs:data" />
                            </div>
                            <div className="flex-1 text-base text-slate-900 dark:text-white font-medium">
                                Storage Plan
                            </div>
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">
                            <ProgressBar
                                value={percentageStorage}
                                title={`Storage used ${usedStorageGB} / ${storageSizeGB} GB`}
                                backClass="h-[14px] rounded-[999px]"
                                className="bg-primary-500"
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <Link
                                to="#"
                                className="inline-flex items-center space-x-3 rtl:space-x-reverse text-sm capitalize font-medium text-slate-600 dark:text-slate-300"
                            >
                                <span>Upgrade Storage Plan</span>{" "}
                                <Icon icon="heroicons:arrow-right" />
                            </Link>

                            <Link
                                to="/storage-transaction-history"
                                onClick={(event) => event.stopPropagation()}
                                className="inline-flex items-center space-x-3 rtl:space-x-reverse text-sm capitalize font-medium text-slate-600 dark:text-slate-300"
                            >
                                <span>View Transitions</span>{" "}
                                <Icon icon="heroicons:arrow-right" />
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
