import React, { useRef, useState, useEffect } from 'react';
import dyzoLogo from '../../assets/images/landing_page/dyzonamelogo.png';
import Textinput from '../ui/Textinput';
import DownloadApp from '../../assets/images/landing_page/DownloadApp.webp';
import Button from '../ui/Button';
import { useForm } from "react-hook-form";
import { fetchPOST } from '../../store/api/apiSlice';
import { useSelector } from 'react-redux';
import { Icon } from '@iconify/react';

const TimerOnboarding = ({ stepSize, setStepSize }) => {
    const userInfo = useSelector((state) => state.auth.user);
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef(null);
    const { id, name, project_name } = JSON.parse(localStorage.getItem('task'));
    const startTimeRef = useRef(null);
    const endTimeRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const { register, handleSubmit } = useForm();

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        setIsMobile(/mobile|android|iphone|ipad/.test(userAgent));
    }, []);

    const detectPlatform = () => {
        const platform = window.navigator.platform.toLowerCase();
        if (platform.includes("win")) {
            return "windows";
        } else if (platform.includes("mac")) {
            return "mac";
        }
        return "unknown";
    };

    const appendDesktopAppNotification = () => {
        const platform = detectPlatform();
        let downloadLink = "#";

        if (platform === "windows") {
            downloadLink = "https://staging.api.dyzo.ai/downloads/windows/latest-build";
        } else if (platform === "mac") {
            downloadLink = "https://github.com/prpwebsteam/dyzo-desktop-app/releases/download/mac1.0.1/Dyzo.AI-1.0.16.dmg";
        }

        const link = document.createElement('a');
        link.target = '_blank';
        link.href = downloadLink;
        link.download = downloadLink.split('/').pop();
        link.click();
    };

    const onSubmit = async () => {
        try {
            pause();
            setLoading(true);

            if (!startTimeRef.current) startTimeRef.current = new Date();
            if (!endTimeRef.current) endTimeRef.current = new Date();

            const startTimeFormatted = startTimeRef.current?.toISOString();
            const endTimeFormatted = endTimeRef.current?.toISOString();
            const response = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/tasklog/new/create/`, {
                body: { taskId: id, userId: userInfo._id, startTime: startTimeFormatted, endTime: endTimeFormatted }
            });

            if (response.status) {
                setStepSize(stepSize + 1);
            }
        } catch (error) {
            console.error('Unable to create task logs');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = () => {
        const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${secs}`;
    };

    const start = () => {
        if (!isRunning) {
            startTimeRef.current = new Date();
            intervalRef.current = setInterval(() => {
                setSeconds(prevSeconds => prevSeconds + 1);
            }, 1000);
            setIsRunning(true);
        }
    };

    const pause = () => {
        endTimeRef.current = new Date();
        clearInterval(intervalRef.current);
        setIsRunning(false);
    };

    return (
        <div className="p-8">
            <div>
                <img src={dyzoLogo} alt="Dyzo logo" className="rounded-full" />
            </div>

            <div className="flex flex-col-reverse lg:grid lg:grid-cols-[0.3fr_0.7fr] gap-5 px-4 mt-8">

                <div>
                    <h2 className="text-3xl  mb-4 text-black-500 leading-10 font-normal">Let’s get the clock ticking <br /> on {name}.</h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-4">
                        <p className="text-[#1e1f21] text-xl font-medium">Easily track the time you spend on your tasks.</p>
                        <Textinput
                            type="text"
                            placeholder="Task name"
                            name="task_name"
                            defaultValue={name}
                            className="w-full p-2 border border-gray-300 rounded"
                            disabled={true}
                            register={register}
                        />

                        <div className="text-center mt-8">
                            <span className="text-4xl font-bold">{formatTime()}</span>
                            <div className="flex justify-center space-x-4 mt-3">
                                <button
                                    type="button"
                                    onClick={isRunning ? pause : start}
                                    className={`px-4 py-2 ${isRunning ? 'bg-red-500' : 'bg-blue-500'} text-white rounded hover:${isRunning ? 'bg-red-600' : 'bg-blue-600'}`}
                                >
                                    {isRunning ? 'Stop' : 'Start'}
                                </button>
                            </div>
                        </div>

                        {isMobile ? (
                            <p className="mb-4 text-[#1e1f21] text-xl font-medium">
                                "Dyzo offers a desktop app for enhanced productivity tracking. Access the download link on your dashboard."
                            </p>
                        ) : (
                            <>
                                <p className="mb-4 text-[#1e1f21] text-base font-medium">
                                    Download the app to track tasks, productivity, and capture screenshots accurately.
                                </p>
                                <Button
                                    text="Download Dyzo Desktop"
                                    className="bg-black-500 text-white px-4 py-2 rounded mt-3 w-full cursor-pointer"
                                    icon="formkit:download"
                                    onClick={appendDesktopAppNotification}
                                />
                            </>
                        )}

                        <button
                            type="submit"
                            className="bg-black-500 text-white px-4 py-2 rounded mt-3"
                            disabled={loading}
                        >
                            {loading ?  <Icon icon="tabler:circle" className='w-5 h-5 m-auto' /> : 'Next'}
                        </button>
                    </form>
                </div>

                <div className="border-t-8 border-gray-300 rounded-lg overflow-hidden">
                    <div className="w-full h-8 bg-gray-300 flex items-center px-4 space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    </div>

                    <div className="p-4">
                        <div className="flex items-center mb-4">
                            <div className="bg-teal-200 p-4 rounded">
                                <Icon icon="gravity-ui:dots-9" className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="ml-4 text-2xl font-bold">{project_name}</h1>
                        </div>

                        <ul className="space-y-6">
                            <li className="flex items-center">
                                <Icon icon="gg:check-o" className="w-10 h-10 mr-3" />
                                <div className="ml-2 w-full text-gray-700 text-lg flex justify-between items-center">
                                    <span>{name}</span>
                                    <span>{formatTime(seconds)}</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default TimerOnboarding; 
