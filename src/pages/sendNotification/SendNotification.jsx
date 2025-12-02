import React, { useState } from 'react'
import Textinput from '@/components/ui/Textinput'
import Button from '@/components/ui/Button';
import { useSelector } from 'react-redux';
import { fetchAuthPost } from '@/store/api/apiSlice';

const SendNotification = () => {
    const userInfo = useSelector(state => state.auth.user);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const baseURL = import.meta.env.VITE_APP_DJANGO;

    const handleSend = async () => {
        try {
            const response = await fetchAuthPost(`${baseURL}/send-notification/${userInfo?._id}/`, {
                body: { title, message }
            });
       
        } catch (error) {
            console.log(error.message);
        }
    }

    return (
        <div className="space-y-4 w-1/2">
            <Textinput
                label="Title "
                classLabel="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 "
                className="w-full"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <Textinput
                label="Message "
                classLabel="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 "
                className="w-full"
                placeholder="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <Button
                text={<span className="hidden sm:inline">Send</span>}
                icon="ic:baseline-plus"
                className="bg-[#0F172A] hover:bg-slate-700 text-white h-10 flex-1 sm:flex-none px-3 sm:px-4"
                onClick={
                    handleSend
                }
            />
        </div>
    )
}

export default SendNotification