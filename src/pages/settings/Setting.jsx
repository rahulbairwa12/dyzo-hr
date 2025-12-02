import React from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const Settings = () => {
    const navigate = useNavigate();
    const userInfo = useSelector((state) => state.auth.user);
    return (
        <div className="bg-white rounded-md p-4 min-h-[80vh]">
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
                {userInfo.isAdmin && (
                    <>

                        <Card>
                            <div className="space-y-6 cursor-pointer" onClick={() => navigate('/settings/company')}>
                                <div className="flex space-x-3 items-center rtl:space-x-reverse">
                                    <div className="flex-none h-8 w-8 rounded-full bg-slate-800 dark:bg-slate-700 text-slate-300 flex flex-col items-center justify-center text-lg">
                                        <Icon icon="heroicons:building-office-2" />
                                    </div>
                                    <div className="flex-1 text-base text-slate-900 dark:text-white font-medium">
                                        Company Settings
                                    </div>
                                </div>
                                <div className="text-slate-600 dark:text-slate-300 text-sm">
                                    Set up your company profile, add your company logo, and configure other company details.
                                </div>
                                <Link
                                    to="#"
                                    className="inline-flex items-center space-x-3 rtl:space-x-reverse text-sm capitalize font-medium text-slate-600 dark:text-slate-300"
                                >
                                    <span>Change Settings</span> <Icon icon="heroicons:arrow-right" />
                                </Link>
                            </div>
                        </Card>

                        {/* <Card>
                            <div className="space-y-6 cursor-pointer" onClick={() => navigate('/settings/language')} >
                                <div className="flex space-x-3 items-center rtl:space-x-reverse">
                                    <div className="flex-none h-8 w-8 rounded-full bg-primary-500 text-slate-300 flex flex-col items-center justify-center text-lg">
                                        <Icon icon="cil:language" />
                                    </div>
                                    <div className="flex-1 text-base text-slate-900 dark:text-white font-medium">
                                        Language Settings
                                    </div>
                                </div>
                                <div className="text-slate-600 dark:text-slate-300 text-sm">
                                    Manage your language preferences across the application.
                                </div>
                                <Link
                                    to="#"
                                    className="inline-flex items-center space-x-3 rtl:space-x-reverse text-sm capitalize font-medium text-slate-600 dark:text-slate-300"
                                >
                                    <span>Change Settings</span> <Icon icon="heroicons:arrow-right" />
                                </Link>
                            </div>
                        </Card> */}

                        <Card>
                            <div className="space-y-6 cursor-pointer" onClick={() => navigate('/settings/screenshot')}>
                                <div className="flex space-x-3 rtl:space-x-reverse items-center">
                                    <div className="flex-none h-8 w-8 rounded-full bg-success-500 text-white flex flex-col items-center justify-center text-lg">
                                        <Icon icon="fluent:screenshot-16-regular" />
                                    </div>
                                    <div className="flex-1 text-base text-slate-900 dark:text-white font-medium">
                                        Screenshot Settings
                                    </div>
                                </div>
                                <div className="text-slate-600 dark:text-slate-300 text-sm">
                                    Customize how screenshots are captured and stored within the app.
                                </div>
                                <Link
                                    to="#"
                                    className="inline-flex items-center space-x-3 rtl:space-x-reverse text-sm capitalize font-medium text-slate-600 dark:text-slate-300"
                                >
                                    <span>Change Settings</span> <Icon icon="heroicons:arrow-right" />
                                </Link>
                            </div>
                        </Card>

                        {/* <Card>
                            <div className="space-y-6 cursor-pointer" onClick={() => navigate('/settings/leave')}>
                                <div className="flex space-x-3 rtl:space-x-reverse items-center">
                                    <div className="flex-none h-8 w-8 rounded-full bg-primary-500 text-white flex flex-col items-center justify-center text-lg">
                                        <Icon icon="material-symbols-light:holiday-village-outline" />
                                    </div>
                                    <div className="flex-1 text-base text-slate-900 dark:text-white font-medium">
                                        Leave Settings
                                    </div>
                                </div>
                                <div className="text-slate-600 dark:text-slate-300 text-sm">
                                    Configure leave policies and manage leave requests.
                                </div>
                                <Link
                                    to="#"
                                    className="inline-flex items-center space-x-3 rtl:space-x-reverse text-sm capitalize font-medium text-slate-600 dark:text-slate-300"
                                >
                                    <span>Change Settings</span> <Icon icon="heroicons:arrow-right" />
                                </Link>
                            </div>
                        </Card> */}

                        {/* <Card>
                            <div className="space-y-6 cursor-pointer" onClick={() => navigate('/settings/address')}>
                                <div className="flex space-x-3 rtl:space-x-reverse items-center">
                                    <div className="flex-none h-8 w-8 rounded-full bg-primary-500 text-white flex flex-col items-center justify-center text-lg">
                                        <Icon icon="material-symbols-light:holiday-village-outline" />
                                    </div>
                                    <div className="flex-1 text-base text-slate-900 dark:text-white font-medium">
                                        Address Settings
                                    </div>
                                </div>
                                <div className="text-slate-600 dark:text-slate-300 text-sm">
                                    Customize & Preview in Real Time.
                                </div>
                                <Link
                                    to="#"
                                    className="inline-flex items-center space-x-3 rtl:space-x-reverse text-sm capitalize font-medium text-slate-600 dark:text-slate-300"
                                >
                                    <span>Change Settings</span> <Icon icon="heroicons:arrow-right" />
                                </Link>
                            </div>
                        </Card> */}
                        <Card>
                            <div className="space-y-6 cursor-pointer" onClick={() => navigate('/settings/subscription')}>
                                <div className="flex space-x-3 rtl:space-x-reverse items-center">
                                    <div className="flex-none h-8 w-8 rounded-full bg-slate-800 text-white flex flex-col items-center justify-center text-lg">
                                        <Icon icon="streamline:subscription-cashflow-solid" />
                                    </div>
                                    <div className="flex-1 text-base text-slate-900 dark:text-white font-medium">
                                        Manage Subscription
                                    </div>
                                </div>
                                <div className="text-slate-600 dark:text-slate-300 text-sm">
                                    Upgrade & Cancel Subscription.
                                </div>
                                <Link
                                    to="#"
                                    className="inline-flex items-center space-x-3 rtl:space-x-reverse text-sm capitalize font-medium text-slate-600 dark:text-slate-300"
                                >
                                    <span>Change Settings</span> <Icon icon="heroicons:arrow-right" />
                                </Link>
                            </div>
                        </Card>
                        
                    </>
                )}

                {/* <Card>
                    <div className="space-y-6 cursor-pointer" onClick={() => navigate('/settings/change-password')}>
                        <div className="flex space-x-3 rtl:space-x-reverse items-center">
                            <div className="flex-none h-8 w-8 rounded-full bg-slate-800 text-white flex flex-col items-center justify-center text-lg">
                                <Icon icon="material-symbols-light:password" />
                            </div>
                            <div className="flex-1 text-base text-slate-900 dark:text-white font-medium">
                                Change Password Settings
                            </div>
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">
                            Update your password for account security.
                        </div>
                        <Link
                            to="#"
                            className="inline-flex items-center space-x-3 rtl:space-x-reverse text-sm capitalize font-medium text-slate-600 dark:text-slate-300"
                        >
                            <span>Change Settings</span> <Icon icon="heroicons:arrow-right" />
                        </Link>
                    </div>
                </Card> */}

                <Card>
                    <div className="space-y-6 cursor-pointer" onClick={() => navigate('/settings/customizer')}>
                        <div className="flex space-x-3 rtl:space-x-reverse items-center">
                            <div className="flex-none h-8 w-8 rounded-full bg-primary-500 text-white flex flex-col items-center justify-center text-lg">
                                <Icon icon="material-symbols-light:holiday-village-outline" />
                            </div>
                            <div className="flex-1 text-base text-slate-900 dark:text-white font-medium">
                                Dyzo Customizer
                            </div>
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">
                            Customize & Preview in Real Time.
                        </div>
                        <Link
                            to="#"
                            className="inline-flex items-center space-x-3 rtl:space-x-reverse text-sm capitalize font-medium text-slate-600 dark:text-slate-300"
                        >
                            <span>Change Settings</span> <Icon icon="heroicons:arrow-right" />
                        </Link>
                    </div>
                </Card>
                <Card>
                    <div className="space-y-6 cursor-pointer" onClick={() => navigate('/settings/notifications')}>
                        <div className="flex space-x-3 items-center rtl:space-x-reverse">
                            <div className="flex-none h-8 w-8 rounded-full bg-slate-800 dark:bg-slate-700 text-slate-300 flex flex-col items-center justify-center text-lg">
                                <Icon icon="heroicons:bell" className="w-5 h-5 text-white-600" />
                            </div>
                            <div className="flex-1 text-base text-slate-900 dark:text-white font-medium">
                                Notification Settings
                            </div>
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">
                            Set up your notification preferences, and configure other notification settings.
                        </div>
                        <Link
                            to="#"
                            className="inline-flex items-center space-x-3 rtl:space-x-reverse text-sm capitalize font-medium text-slate-600 dark:text-slate-300"
                        >
                            <span>Change Settings</span> <Icon icon="heroicons:arrow-right" />
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
