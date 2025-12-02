import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import useWidth from "@/hooks/useWidth";
import { fetchAuthPost, fetchAuthGET } from "@/store/api/apiSlice";
import { toast, ToastContainer } from "react-toastify";
import Button from "@/components/ui/Button";
import CreateHoliday from "@/components/holiday/CreateHoliday";
import SkeletionTable from "@/components/skeleton/Table";
import HolidayList from "@/components/holiday/HolidayList";
import DeleteClientPopUp from "@/components/client/DeleteClientPopUp";
import EditHoliday from "@/components/holiday/EditHoliday";
import ImportModal from "@/components/holiday/ImportModal";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";

const Holiday = () => {
    const [holidayList, setHolidayList] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const { width, breakpoints } = useWidth();
    const [isLoaded, setIsLoaded] = useState(true);
    const userInfo = useSelector((state) => state.auth.user);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteHolidayModal, setShowDeleteHolidayModal] = useState(false);
    const [holidayDeleteId, setHolidayDeleteId] = useState([]);
    const [holidayId, setHolidayId] = useState(null);
    const [data, setData] = useState({});
    const [showHolidayEditModal, setShowHolidayEditModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const isMobile = width < breakpoints.md;

    const handleSetDeleteId = (id) => {
        setHolidayDeleteId((prev) => {
            if (!prev.includes(id)) {
                return [...prev, id];
            }
            return prev.filter((deleteId) => deleteId !== id);
        });
    };

    const fetchHolidays = async () => {
        try {
            setIsLoaded(true);
            const { holidays } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/holidays/${userInfo.companyId}/${selectedYear}/`);
            if (holidays) {
                setHolidayList(holidays);
            }
        } catch (error) {
            toast.error("Failed to fetch holidays");
        } finally {
            setIsLoaded(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, [userInfo.companyId, selectedYear]);

    const handleDelete = async () => {
        try {
            setDeleteLoading(true);
            const isHolidayDeleted = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/holidays/delete/`, { body: { "holidayIds": holidayDeleteId } });
            if (isHolidayDeleted.status) {
                toast.success("Holiday's are deleted successfully");
                setHolidayDeleteId([]);
                fetchHolidays();
                setShowDeleteHolidayModal(false);
            }
        } catch (error) {
            toast.error("Failed to delete holidays");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleYearChange = (year) => {
        setSelectedYear(year);
    };

    const generateYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 2; i <= currentYear + 3; i++) {
            years.push(i);
        }
        return years;
    };

    return (
        <div className="w-full overflow-hidden">
            <ToastContainer />
            <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900">
                        Holidays
                    </h4>
                    <div className="inline-flex">
                        <select 
                            value={selectedYear}
                            onChange={(e) => handleYearChange(parseInt(e.target.value))}
                            className="text-sm rounded-md border border-slate-200 px-3 py-1.5 bg-white dark:bg-slate-800 dark:border-slate-700"
                        >
                            {generateYearOptions().map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                    <Button
                        icon="material-symbols:upload"
                        text={isMobile ? "" : "Import"}
                        className={`btn-dark dark:bg-slate-800 h-min text-sm font-normal ${isMobile ? 'p-2' : ''}`}
                        iconClass={`${isMobile ? 'text-base' : 'text-lg'}`}
                        onClick={() => setShowImportModal(true)}
                    />
                    <Button
                        icon="heroicons-outline:plus"
                        text={isMobile ? "" : "Add Holiday"}
                        className={`btn-dark dark:bg-slate-800 h-min text-sm font-normal ${isMobile ? 'p-2' : ''}`}
                        iconClass={`${isMobile ? 'text-base' : 'text-lg'}`}
                        onClick={() => setShowCreateModal(true)}
                    />
                </div>
            </div>

            {holidayDeleteId.length > 0 && (
                <div className="mb-4">
                    <Card bodyClass="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon icon="heroicons-outline:trash" className="text-danger-500 text-lg" />
                                <span className="font-medium">
                                    {holidayDeleteId.length} {holidayDeleteId.length === 1 ? 'holiday' : 'holidays'} selected
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    text="Cancel" 
                                    className="border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700"
                                    onClick={() => setHolidayDeleteId([])}
                                />
                                <Button 
                                    text="Delete" 
                                    className="btn-danger" 
                                    icon="heroicons-outline:trash"
                                    onClick={() => setShowDeleteHolidayModal(true)}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {isLoaded ? (
                <SkeletionTable count="10" />
            ) : (
                <div className={`${isMobile ? 'overflow-x-auto -mx-4 px-4' : ''}`}>
                    {holidayList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <Icon icon="heroicons-outline:calendar" className="text-4xl text-slate-300" />
                            <p className="text-center text-slate-500">No holidays found for {selectedYear}</p>
                            <div className="flex gap-3">
                                <Button
                                    icon="material-symbols:upload"
                                    text="Import"
                                    className="btn-outline-dark"
                                    onClick={() => setShowImportModal(true)}
                                />
                                <Button
                                    icon="heroicons-outline:plus"
                                    text="Add Holiday"
                                    className="btn-dark dark:bg-slate-800 h-min text-sm"
                                    onClick={() => setShowCreateModal(true)}
                                />
                            </div>
                        </div>
                    ) : (
                        <HolidayList 
                            holidayList={holidayList} 
                            handleSetDeleteId={handleSetDeleteId}
                            selectedIds={holidayDeleteId} 
                            setData={setData} 
                            setHolidayId={setHolidayId} 
                            setShowHolidayEditModal={setShowHolidayEditModal}
                        />
                    )}
                </div>
            )}

            {showCreateModal && (
                <CreateHoliday 
                    showCreateModal={showCreateModal} 
                    setShowCreateModal={setShowCreateModal} 
                    fetchHolidays={fetchHolidays} 
                />
            )}

            {showHolidayEditModal && (
                <EditHoliday
                    showHolidayEditModal={showHolidayEditModal}
                    setShowHolidayEditModal={setShowHolidayEditModal}
                    fetchHolidays={fetchHolidays}
                    data={data}
                    setData={setData}
                    holidayId={holidayId}
                    setHolidayId={setHolidayId}
                />
            )}

            {showImportModal && (
                <ImportModal 
                    showImportModal={showImportModal} 
                    setShowImportModal={setShowImportModal} 
                    fetchHolidays={fetchHolidays} 
                />
            )}

            <DeleteClientPopUp 
                showModal={showDeleteHolidayModal} 
                onClose={() => setShowDeleteHolidayModal(false)} 
                handleDelete={handleDelete} 
                loading={deleteLoading}
                title={`Delete ${holidayDeleteId.length > 1 ? 'Holidays' : 'Holiday'}`}
                content={`Are you sure you want to delete ${holidayDeleteId.length} selected ${holidayDeleteId.length > 1 ? 'holidays' : 'holiday'}?`}
            />
        </div>
    );
};

export default Holiday;
