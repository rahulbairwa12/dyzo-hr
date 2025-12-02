import React, { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { toast } from 'react-toastify'
import { fetchAuthPatch } from '@/store/api/apiSlice'
import { useSelector } from 'react-redux'

const Status = ({ showStatusModal, setShowStatusModal, selectedStatus, setSelectedStatus, userId }) => {

    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setSelectedStatus(e.target.value)
    }

    const handleStatusChange = async () => {
        try {
            setLoading(true)
            const response = await fetchAuthPatch(
              `${import.meta.env.VITE_APP_DJANGO}/employee/${userId}/`,
              { body: { status: selectedStatus } }
            );
            if (response.status) {
                toast.success('Status updated successfully');
                setShowStatusModal(false);
            }
        } catch (error) {
            toast.error("Status not updated");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            activeModal={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            title='Status Modal'
        >
            <div>
                <div className="grid gap-4 my-5">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        
                        {/* 1) Active */}
                        <label
                            htmlFor="status-active"
                            className={`relative flex cursor-pointer p-2 dark:bg-neutral-800 dark:border-neutral-700 ${
                                selectedStatus === 'Active' ? 'border border-gray-900' : 'border'
                            }`}
                        >
                            <input
                                type="radio"
                                id="status-active"
                                name="hs-pro-dupsms"
                                value="Active"
                                className="absolute w-full cursor-pointer opacity-0"
                                onChange={handleChange}
                            />
                            <span className="dark:text-white">
                                🟢 <span className="ml-2">Active</span>
                            </span>
                        </label>
                        
                        {/* 2) Away */}
                        <label
                            htmlFor="status-away"
                            className={`relative flex cursor-pointer p-2 dark:bg-neutral-800 dark:border-neutral-700 ${
                                selectedStatus === 'Away' ? 'border border-gray-900' : 'border'
                            }`}
                        >
                            <input
                                type="radio"
                                id="status-away"
                                name="hs-pro-dupsms"
                                value="Away"
                                className="absolute w-full cursor-pointer opacity-0"
                                onChange={handleChange}
                            />
                            <span className="dark:text-white">
                                🕒 <span className="ml-2">Away</span>
                            </span>
                        </label>
                        
                        {/* 3) Do not disturb */}
                        <label
                            htmlFor="status-dnd"
                            className={`relative flex cursor-pointer p-2 dark:bg-neutral-800 dark:border-neutral-700 ${
                                selectedStatus === 'Do not disturb' ? 'border border-gray-900' : 'border'
                            }`}
                        >
                            <input
                                type="radio"
                                id="status-dnd"
                                name="hs-pro-dupsms"
                                value="Do not disturb"
                                className="absolute w-full cursor-pointer opacity-0"
                                onChange={handleChange}
                            />
                            <span className="dark:text-white">
                                ⛔ <span className="ml-2">Do not disturb</span>
                            </span>
                        </label>
                        
                        {/* 4) In a meeting */}
                        <label
                            htmlFor="status-meeting"
                            className={`relative flex cursor-pointer p-2 dark:bg-neutral-800 dark:border-neutral-700 ${
                                selectedStatus === 'In a meeting' ? 'border border-gray-900' : 'border'
                            }`}
                        >
                            <input
                                type="radio"
                                id="status-meeting"
                                name="hs-pro-dupsms"
                                value="In a meeting"
                                className="absolute w-full cursor-pointer opacity-0"
                                onChange={handleChange}
                            />
                            <span className="dark:text-white">
                                📅 <span className="ml-2">In a meeting</span>
                            </span>
                        </label>
                        
                        {/* 5) Out sick */}
                        <label
                            htmlFor="status-sick"
                            className={`relative flex cursor-pointer p-2 dark:bg-neutral-800 dark:border-neutral-700 ${
                                selectedStatus === 'Out sick' ? 'border border-gray-900' : 'border'
                            }`}
                        >
                            <input
                                type="radio"
                                id="status-sick"
                                name="hs-pro-dupsms"
                                value="Out sick"
                                className="absolute w-full cursor-pointer opacity-0"
                                onChange={handleChange}
                            />
                            <span className="dark:text-white">
                                🤒 <span className="ml-2">Out sick</span>
                            </span>
                        </label>
                        
                        {/* 6) Commuting */}
                        <label
                            htmlFor="status-commuting"
                            className={`relative flex cursor-pointer p-2 dark:bg-neutral-800 dark:border-neutral-700 ${
                                selectedStatus === 'Commuting' ? 'border border-gray-900' : 'border'
                            }`}
                        >
                            <input
                                type="radio"
                                id="status-commuting"
                                name="hs-pro-dupsms"
                                value="Commuting"
                                className="absolute w-full cursor-pointer opacity-0"
                                onChange={handleChange}
                            />
                            <span className="dark:text-white">
                                🚗 <span className="ml-2">Commuting</span>
                            </span>
                        </label>
                        
                        {/* 7) On leave */}
                        <label
                            htmlFor="status-leave"
                            className={`relative flex cursor-pointer p-2 dark:bg-neutral-800 dark:border-neutral-700 ${
                                selectedStatus === 'On leave' ? 'border border-gray-900' : 'border'
                            }`}
                        >
                            <input
                                type="radio"
                                id="status-leave"
                                name="hs-pro-dupsms"
                                value="On leave"
                                className="absolute w-full cursor-pointer opacity-0"
                                onChange={handleChange}
                            />
                            <span className="dark:text-white">
                                🌴 <span className="ml-2">On leave</span>
                            </span>
                        </label>
                        
                        {/* 8) Focusing */}
                        <label
                            htmlFor="status-focusing"
                            className={`relative flex cursor-pointer p-2 dark:bg-neutral-800 dark:border-neutral-700 ${
                                selectedStatus === 'Focusing' ? 'border border-gray-900' : 'border'
                            }`}
                        >
                            <input
                                type="radio"
                                id="status-focusing"
                                name="hs-pro-dupsms"
                                value="Focusing"
                                className="absolute w-full cursor-pointer opacity-0"
                                onChange={handleChange}
                            />
                            <span className="dark:text-white">
                                🔕 <span className="ml-2">Focusing</span>
                            </span>
                        </label>
                        
                        {/* 9) Working remotely */}
                        <label
                            htmlFor="status-remote"
                            className={`relative flex cursor-pointer p-2 dark:bg-neutral-800 dark:border-neutral-700 ${
                                selectedStatus === 'Working remotely' ? 'border border-gray-900' : 'border'
                            }`}
                        >
                            <input
                                type="radio"
                                id="status-remote"
                                name="hs-pro-dupsms"
                                value="Working remotely"
                                className="absolute w-full cursor-pointer opacity-0"
                                onChange={handleChange}
                            />
                            <span className="dark:text-white">
                                🏠 <span className="ml-2">Working remotely</span>
                            </span>
                        </label>

                        {/* 10) Offline */}
                        <label
                            htmlFor="status-offline"
                            className={`relative flex cursor-pointer p-2 dark:bg-neutral-800 dark:border-neutral-700 ${
                                selectedStatus === 'Offline' ? 'border border-gray-900' : 'border'
                            }`}
                        >
                            <input
                                type="radio"
                                id="status-offline"
                                name="hs-pro-dupsms"
                                value="Offline"
                                className="absolute w-full cursor-pointer opacity-0"
                                onChange={handleChange}
                            />
                            <span className="dark:text-white">
                                📴 <span className="ml-2">Offline</span>
                            </span>
                        </label>

                        {/* 11) Out for Lunch */}
                        <label
                            htmlFor="status-lunch"
                            className={`relative flex cursor-pointer p-2 dark:bg-neutral-800 dark:border-neutral-700 ${
                                selectedStatus === 'Out for Lunch' ? 'border border-gray-900' : 'border'
                            }`}
                        >
                            <input
                                type="radio"
                                id="status-lunch"
                                name="hs-pro-dupsms"
                                value="Out for Lunch"
                                className="absolute w-full cursor-pointer opacity-0"
                                onChange={handleChange}
                            />
                            <span className="dark:text-white">
                                🍽️ <span className="ml-2">Out for Lunch</span>
                            </span>
                        </label>

                    </div>
                </div>

                <div className="flex justify-center items-end">
                    <Button
                        onClick={handleStatusChange}
                        className="bg-black-500 text-white"
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default Status
