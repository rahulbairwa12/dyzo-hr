import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import dyzoLogo from '../../assets/images/landing_page/dyzonamelogo.png'
import { useNavigate } from 'react-router-dom';


const InviteEmployeeOnboarding = () => {
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();

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

    return (
        <div className="p-8 bg-gradient-to-r bg-white min-h-screen flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg max-w-lg w-full text-center">
                <img
                    src={dyzoLogo}
                    alt="Dyzo Logo"
                    className="mx-auto mb-6"
                />
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Get Started with Dyzo</h2>
    
                {isMobile ? (
                    <p className="text-lg text-gray-700 mb-6">
                        Dyzo offers a desktop app for enhanced productivity tracking. Download it from your dashboard.
                    </p>
                ) : (
                    <>
                        <p className="text-lg text-gray-700 mb-6">
                            Download the Dyzo desktop app to track tasks, improve productivity, and capture screenshots accurately.
                        </p>
                        <Button
                            text="Download Dyzo Desktop App"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300"
                            icon="formkit:download"
                            onClick={appendDesktopAppNotification}
                        />
                    </>
                )}
    
                {/* The Skip button is now outside the conditional so it always shows */}
                <p
                    className="text-lg text-blue-500 mt-6 underline cursor-pointer"
                    onClick={() => navigate('/tasks')}
                >
                    Go To Dashboard
                </p>
            </div>
        </div>
    );
};

export default InviteEmployeeOnboarding;
